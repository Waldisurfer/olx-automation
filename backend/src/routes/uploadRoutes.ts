import { Router } from 'express';
import { upload, ImageStorageService } from '../services/ImageStorageService.js';
import type { Request } from 'express';

export const uploadRouter = Router();

uploadRouter.post('/photos', upload.array('photos', 8), async (req: Request, res, next) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }

    const results = await Promise.all(
      files.map((f) => ImageStorageService.saveFile(f.buffer, f.originalname))
    );

    res.json({
      fileIds: results.map((r) => r.fileId),
      previewUrls: results.map((r) => r.previewUrl),
    });
  } catch (err) {
    next(err);
  }
});

uploadRouter.delete('/photos/:fileId', (req, res) => {
  ImageStorageService.delete(req.params.fileId);
  res.json({ ok: true });
});
