import cron from 'node-cron';
import { ListingRepository } from '../db/repositories/ListingRepository.js';
import { ListingPublisher } from '../services/ListingPublisher.js';
import { config } from '../config/AppConfig.js';

export function startPriceReductionJob(): void {
  // Runs every 12 hours
  cron.schedule('0 */12 * * *', async () => {
    console.log('[PriceReductionJob] Checking for listings due for price reduction...');

    const due = await ListingRepository.findDueForReduction();
    if (due.length === 0) {
      console.log('[PriceReductionJob] No listings due for reduction.');
      return;
    }

    let reduced = 0;
    for (const listing of due) {
      try {
        const newPrice = Math.max(
          Math.round((listing.price * (1 - listing.reductionPercent / 100)) / 10) * 10,
          config.priceReduction.minPricePln
        );

        if (newPrice >= listing.price) {
          console.log(`[PriceReductionJob] Listing #${listing.id} already at minimum price, skipping.`);
          continue;
        }

        await ListingPublisher.updatePrice(listing, newPrice, 'auto_reduction');
        console.log(`[PriceReductionJob] Listing #${listing.id} "${listing.title}": ${listing.price} PLN → ${newPrice} PLN`);
        reduced++;
      } catch (err) {
        console.error(`[PriceReductionJob] Failed to reduce price for listing #${listing.id}:`, err);
        // Do NOT advance next_reduction_at — will retry on next run
      }
    }

    console.log(`[PriceReductionJob] Done. Reduced ${reduced}/${due.length} listings.`);
  });

  console.log('[PriceReductionJob] Scheduled (every 12h)');
}
