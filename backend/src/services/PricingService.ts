import type { SimilarListing, PriceSuggestion } from '../types/Listing.types.js';

export const PricingService = {
  suggest(listings: SimilarListing[]): PriceSuggestion {
    if (listings.length === 0) {
      return { suggestedPrice: 0, averagePrice: 0, minPrice: 0, maxPrice: 0, sampleSize: 0, similarListings: [] };
    }

    const prices = listings.map((l) => l.price).sort((a, b) => a - b);

    // Remove bottom 10% and top 10% outliers
    const trimCount = Math.floor(prices.length * 0.1);
    const trimmed = prices.slice(trimCount, prices.length - trimCount || undefined);

    const sum = trimmed.reduce((a, b) => a + b, 0);
    const avg = sum / trimmed.length;
    const min = prices[0];
    const max = prices[prices.length - 1];

    // Suggest 5% above average, rounded to nearest 10 PLN
    const suggested = Math.round((avg * 1.05) / 10) * 10;

    return {
      suggestedPrice: suggested,
      averagePrice: Math.round(avg),
      minPrice: min,
      maxPrice: max,
      sampleSize: listings.length,
      similarListings: listings,
    };
  },
};
