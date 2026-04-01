import { Router } from 'express';
import { z } from 'zod';
import { ListingRepository } from '../db/repositories/ListingRepository.js';
import { PriceHistoryRepository } from '../db/repositories/PriceHistoryRepository.js';
import { ListingPublisher } from '../services/ListingPublisher.js';
import { ClaudeVisionService } from '../services/ClaudeVisionService.js';
import { config } from '../config/AppConfig.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export const listingRouter = Router();
listingRouter.use(authMiddleware);

const ConditionEnum = z.enum(['nowy', 'używany_dobry', 'używany_dostateczny', 'używany_zły']);

const CreateBody = z.object({
  title: z.string().min(1).max(70),
  description: z.string().min(1),
  categoryId: z.number().int().default(0),
  categoryName: z.string().default(''),
  price: z.number().positive(),
  photos: z.array(z.string()).min(1),
  condition: ConditionEnum.default('używany_dobry'),
  city: z.string().default(''),
  negotiable: z.boolean().default(true),
  shipping: z.boolean().default(false),
  aiGeneratedDescription: z.string().optional(),
  reductionPercent: z.number().min(1).max(50).optional(),
  reductionIntervalDays: z.number().int().min(1).optional(),
});

const UpdateBody = z.object({
  title: z.string().min(1).max(70).optional(),
  description: z.string().min(1).optional(),
  categoryId: z.number().int().optional(),
  categoryName: z.string().optional(),
  price: z.number().positive().optional(),
  condition: ConditionEnum.optional(),
  city: z.string().optional(),
  negotiable: z.boolean().optional(),
  shipping: z.boolean().optional(),
  reductionPercent: z.number().min(1).max(50).optional(),
  reductionIntervalDays: z.number().int().min(1).optional(),
});

const PriceBody = z.object({ price: z.number().positive() });

// GET /api/listings
listingRouter.get('/', async (req: AuthRequest, res, next) => {
  try {
    const status = req.query.status as string | undefined;
    const owner = { userId: req.userId, sessionId: req.sessionId };
    const listings = await ListingRepository.findAll(status as never, owner);
    res.json(listings);
  } catch (err) { next(err); }
});

// GET /api/listings/:id
listingRouter.get('/:id', async (req, res, next) => {
  try {
    const listing = await ListingRepository.findById(Number(req.params.id));
    if (!listing) { res.status(404).json({ error: 'Not found' }); return; }
    const history = await PriceHistoryRepository.findByListingId(listing.id);
    res.json({ ...listing, priceHistory: history });
  } catch (err) { next(err); }
});

// POST /api/listings
listingRouter.post('/', async (req: AuthRequest, res, next) => {
  try {
    const dto = CreateBody.parse(req.body);
    const owner = { userId: req.userId, sessionId: req.sessionId };
    const listing = await ListingRepository.create(dto, owner);
    res.status(201).json(listing);
  } catch (err) { next(err); }
});

// PUT /api/listings/:id
listingRouter.put('/:id', async (req, res, next) => {
  try {
    const dto = UpdateBody.parse(req.body);
    const listing = await ListingRepository.update(Number(req.params.id), dto);
    if (!listing) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(listing);
  } catch (err) { next(err); }
});

// DELETE /api/listings/:id
listingRouter.delete('/:id', async (req, res, next) => {
  try {
    const listing = await ListingRepository.findById(Number(req.params.id));
    if (!listing) { res.status(404).json({ error: 'Not found' }); return; }
    if (listing.status === 'active') {
      res.status(400).json({ error: 'Cannot delete an active listing. Deactivate it first.' });
      return;
    }
    await ListingRepository.delete(listing.id);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /api/listings/:id/publish
listingRouter.post('/:id/publish', async (req, res, next) => {
  try {
    const listing = await ListingRepository.findById(Number(req.params.id));
    if (!listing) { res.status(404).json({ error: 'Not found' }); return; }
    if (listing.status !== 'draft') {
      res.status(400).json({ error: 'Only draft listings can be published' });
      return;
    }

    if (config.publicBaseUrl.includes('localhost')) {
      console.warn('[WARN] PUBLIC_BASE_URL is localhost — OLX may not be able to fetch images. Use ngrok/localtunnel.');
    }

    const published = await ListingPublisher.publish(listing);
    res.json(published);
  } catch (err) { next(err); }
});

// POST /api/listings/:id/price
listingRouter.post('/:id/price', async (req, res, next) => {
  try {
    const { price } = PriceBody.parse(req.body);
    const listing = await ListingRepository.findById(Number(req.params.id));
    if (!listing) { res.status(404).json({ error: 'Not found' }); return; }
    await ListingPublisher.updatePrice(listing, price, 'manual');
    res.json(await ListingRepository.findById(listing.id));
  } catch (err) { next(err); }
});

// POST /api/listings/:id/deactivate
listingRouter.post('/:id/deactivate', async (req, res, next) => {
  try {
    const listing = await ListingRepository.findById(Number(req.params.id));
    if (!listing) { res.status(404).json({ error: 'Not found' }); return; }
    await ListingPublisher.deactivate(listing);
    res.json(await ListingRepository.findById(listing.id));
  } catch (err) { next(err); }
});

// POST /api/listings/:id/regenerate
listingRouter.post('/:id/regenerate', async (req, res, next) => {
  try {
    const { changeRequest } = z.object({ changeRequest: z.string().min(1) }).parse(req.body);
    const listing = await ListingRepository.findById(Number(req.params.id));
    if (!listing) { res.status(404).json({ error: 'Not found' }); return; }

    const existing = {
      title: listing.title,
      description: listing.description,
      condition: 'używany_dobry' as const,
      suggestedCategory: listing.categoryName,
      keywords: [],
      officialUrl: undefined,
    };

    const result = await ClaudeVisionService.regenerateDescription(listing.photos, existing, changeRequest);

    await ListingRepository.update(listing.id, {
      title: result.title,
      description: result.description,
      categoryName: result.suggestedCategory,
    });

    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/listings/:id/verify
listingRouter.post('/:id/verify', async (req, res, next) => {
  try {
    const listing = await ListingRepository.findById(Number(req.params.id));
    if (!listing) { res.status(404).json({ error: 'Not found' }); return; }
    const result = await ClaudeVisionService.verifyListing(listing);
    res.json(result);
  } catch (err) { next(err); }
});

// POST /api/listings/:id/set-published
listingRouter.post('/:id/set-published', async (req, res, next) => {
  try {
    const { publishedAt } = z.object({ publishedAt: z.string().min(1) }).parse(req.body);
    const listing = await ListingRepository.findById(Number(req.params.id));
    if (!listing) { res.status(404).json({ error: 'Not found' }); return; }

    const pubDate = new Date(publishedAt);
    const nextReduction = new Date(pubDate);
    nextReduction.setDate(nextReduction.getDate() + listing.reductionIntervalDays);

    await ListingRepository.setPublished(listing.id, pubDate, nextReduction);
    await PriceHistoryRepository.add(listing.id, listing.price, 'initial');

    res.json(await ListingRepository.findById(listing.id));
  } catch (err) { next(err); }
});

// POST /api/listings/:id/mark-sold
listingRouter.post('/:id/mark-sold', async (req, res, next) => {
  try {
    const listing = await ListingRepository.findById(Number(req.params.id));
    if (!listing) { res.status(404).json({ error: 'Not found' }); return; }
    await ListingPublisher.markSold(listing);
    res.json(await ListingRepository.findById(listing.id));
  } catch (err) { next(err); }
});
