import multer from 'multer';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync, unlinkSync, existsSync } from 'fs';
import { config } from '../config/AppConfig.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = join(__dirname, '../../uploads');
mkdirSync(UPLOADS_DIR, { recursive: true });

// Store in memory first, then sharp processes to disk
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

export const ImageStorageService = {
  async saveFile(buffer: Buffer, originalName: string): Promise<{ fileId: string; previewUrl: string }> {
    const fileId = uuidv4();
    const filename = `${fileId}.jpg`;
    const outPath = join(UPLOADS_DIR, filename);

    await sharp(buffer)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toFile(outPath);

    return {
      fileId,
      previewUrl: `/uploads/${filename}`,
    };
  },

  getPublicUrl(fileId: string): string {
    return `${config.publicBaseUrl}/uploads/${fileId}.jpg`;
  },

  delete(fileId: string): void {
    const path = join(UPLOADS_DIR, `${fileId}.jpg`);
    if (existsSync(path)) unlinkSync(path);
  },
};
