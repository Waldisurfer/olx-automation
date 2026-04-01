import { Router } from 'express';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { OlxCategoryService } from '../services/OlxCategoryService.js';
import { config } from '../config/AppConfig.js';

export const categoryRouter = Router();

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

// GET /api/categories – full list (no auth required, uses static fallback)
categoryRouter.get('/', async (_req, res, next) => {
  try {
    const categories = await OlxCategoryService.getAll();
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// POST /api/categories/suggest – AI picks best category for item
const SuggestBody = z.object({
  itemName: z.string().optional(),
  model: z.string().optional(),
  description: z.string().optional(),
  keywords: z.array(z.string()).optional(),
  suggestedCategory: z.string().optional(), // from photo analysis
});

categoryRouter.post('/suggest', async (req, res, next) => {
  try {
    const body = SuggestBody.parse(req.body);
    const categories = await OlxCategoryService.getAll();

    // Build category list for Claude (only leaf + main categories)
    const categoryList = categories
      .map((c) => `${c.id}: ${c.name}`)
      .join('\n');

    const itemDesc = [
      body.itemName && `Przedmiot: ${body.itemName}`,
      body.model && `Model: ${body.model}`,
      body.description && `Opis: ${body.description?.slice(0, 300)}`,
      body.keywords?.length && `Słowa kluczowe: ${body.keywords.join(', ')}`,
      body.suggestedCategory && `Wstępna kategoria: ${body.suggestedCategory}`,
    ]
      .filter(Boolean)
      .join('\n');

    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Jesteś ekspertem od kategoryzacji ogłoszeń na OLX.pl.

Przedmiot do sprzedania:
${itemDesc}

Lista dostępnych kategorii OLX (format "id: nazwa"):
${categoryList}

Wybierz JEDNĄ najlepiej pasującą kategorię. Preferuj bardziej szczegółową podkategorię nad główną.
Odpowiedz TYLKO w formacie JSON: {"id": <number>, "name": "<nazwa kategorii>"}`,
        },
      ],
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text.trim() : '';
    const match = text.match(/\{[^}]+\}/);
    if (!match) {
      res.status(500).json({ error: 'Could not parse category suggestion' });
      return;
    }

    const suggestion = JSON.parse(match[0]) as { id: number; name: string };

    // Validate that id exists in our list
    const found = categories.find((c) => c.id === suggestion.id);
    res.json(found ?? suggestion);
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:id/attributes
categoryRouter.get('/:id/attributes', async (req, res, next) => {
  try {
    const { olxApi } = await import('../services/OlxApiClient.js');
    const { data } = await olxApi.get(`/categories/${req.params.id}/attributes`);
    res.json(data.data);
  } catch (err) {
    next(err);
  }
});
