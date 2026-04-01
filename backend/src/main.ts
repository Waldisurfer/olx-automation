import { initDb } from './db/database.js';
import { createServer } from './server.js';
import { startPriceReductionJob } from './jobs/PriceReductionJob.js';
import { config } from './config/AppConfig.js';

async function main() {
  await initDb();

  const app = createServer();

  app.listen(config.port, () => {
    console.log(`[Server] Running at http://localhost:${config.port}`);
    console.log(`[Server] PUBLIC_BASE_URL = ${config.publicBaseUrl}`);
    startPriceReductionJob();
  });
}

main().catch((err) => {
  console.error('[Fatal]', err);
  process.exit(1);
});
