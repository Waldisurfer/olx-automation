import { Router } from 'express';
import { OlxSearchService } from '../services/OlxSearchService.js';
import { PricingService } from '../services/PricingService.js';

export const searchRouter = Router();

searchRouter.get('/descriptions', async (req, res, next) => {
  try {
    const keywords = req.query.keywords as string;
    if (!keywords) { res.status(400).json({ error: 'keywords required' }); return; }
    const results = await OlxSearchService.fetchDescriptions(keywords);
    res.json(results);
  } catch (err) { next(err); }
});

searchRouter.get('/similar', async (req, res, next) => {
  try {
    const keywords = req.query.keywords as string;
    const categoryId = req.query.categoryId ? Number(req.query.categoryId) : undefined;

    if (!keywords) {
      res.status(400).json({ error: 'keywords query param is required' });
      return;
    }

    const listings = await OlxSearchService.findSimilar(keywords, categoryId);
    const suggestion = PricingService.suggest(listings);
    res.json(suggestion);
  } catch (err) {
    next(err);
  }
});
