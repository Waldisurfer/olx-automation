import { Router } from 'express';
import { ClaudeVisionService } from '../services/ClaudeVisionService.js';
import { z } from 'zod';

export const analyzeRouter = Router();

const AnalyzeBody = z.object({
  fileIds: z.array(z.string().uuid()).min(1).max(8),
  hints: z.string().max(500).optional(),
  metadata: z.object({
    itemName: z.string().optional(),
    model: z.string().optional(),
    yearOfProduction: z.string().optional(),
    category: z.string().optional(),
    additionalInfo: z.string().optional(),
  }).optional(),
});

analyzeRouter.post('/', async (req, res, next) => {
  try {
    const { fileIds, metadata, hints } = AnalyzeBody.parse(req.body);
    const result = await ClaudeVisionService.analyzePhotos(fileIds, metadata, hints);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/analyze/documents — OCR receipt/invoice/nameplate → extract product info
analyzeRouter.post('/documents', async (req, res, next) => {
  try {
    const { fileIds } = z.object({ fileIds: z.array(z.string().uuid()).min(1).max(3) }).parse(req.body);
    const result = await ClaudeVisionService.extractFromDocuments(fileIds);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
