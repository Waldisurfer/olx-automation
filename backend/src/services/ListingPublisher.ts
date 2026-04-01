import { olxApi } from './OlxApiClient.js';
import { ImageStorageService } from './ImageStorageService.js';
import { ListingRepository } from '../db/repositories/ListingRepository.js';
import { PriceHistoryRepository } from '../db/repositories/PriceHistoryRepository.js';
import type { Listing } from '../types/Listing.types.js';
import type { OlxAdvertResponse } from '../types/OlxApi.types.js';

export const ListingPublisher = {
  async publish(listing: Listing): Promise<Listing> {
    if (listing.categoryId === 0) {
      throw new Error('Category must be set before publishing');
    }

    const images = listing.photos.map((fileId) => ({
      url: ImageStorageService.getPublicUrl(fileId),
    }));

    // Map common Polish cities to OLX city IDs (fallback: Warszawa = 9)
    const cityIdMap: Record<string, number> = {
      'warszawa': 9, 'warsaw': 9,
      'kraków': 14, 'krakow': 14,
      'wrocław': 21, 'wroclaw': 21,
      'poznań': 20, 'poznan': 20,
      'gdańsk': 11, 'gdansk': 11,
      'gdynia': 12,
      'łódź': 15, 'lodz': 15,
      'katowice': 13,
      'lublin': 16,
      'bydgoszcz': 10,
      'białystok': 191, 'bialystok': 191,
      'szczecin': 19,
      'rzeszów': 191, 'rzeszow': 191,
      'leszno': 214,
    };
    const cityKey = listing.city.toLowerCase().trim();
    const cityId = cityIdMap[cityKey] ?? 9;

    const attributes = listing.condition !== 'nowy'
      ? [{ code: 'state', value: listing.condition }]
      : [{ code: 'state', value: 'nowy' }];

    const payload = {
      title: listing.title,
      description: listing.description,
      category_id: listing.categoryId,
      advertiser_type: 'private' as const,
      contact: { name: 'Sprzedający' },
      location: { city_id: cityId },
      attributes,
      price: { value: listing.price, currency: 'PLN' as const, negotiable: listing.negotiable },
      images,
      external_id: String(listing.id),
    };

    const { data } = await olxApi.post<{ data: OlxAdvertResponse }>('/adverts', payload);
    const advert = data.data;

    await ListingRepository.setOlxData(listing.id, advert.id, advert.url ?? '');
    await PriceHistoryRepository.add(listing.id, listing.price, 'initial');

    return (await ListingRepository.findById(listing.id))!;
  },

  async updatePrice(listing: Listing, newPrice: number, reason: 'manual' | 'auto_reduction'): Promise<void> {
    if (listing.olxAdvertId) {
      await olxApi.put(`/adverts/${listing.olxAdvertId}`, {
        price: { value: newPrice, currency: 'PLN', negotiable: true },
      });
    }

    await ListingRepository.updatePrice(listing.id, newPrice);
    await PriceHistoryRepository.add(listing.id, newPrice, reason);
  },

  async deactivate(listing: Listing): Promise<void> {
    if (listing.olxAdvertId) {
      await olxApi.delete(`/adverts/${listing.olxAdvertId}`).catch(() => {
        // Already removed from OLX – still update local state
      });
    }
    await ListingRepository.setStatus(listing.id, 'paused');
  },

  async markSold(listing: Listing): Promise<void> {
    if (listing.olxAdvertId) {
      await olxApi
        .put(`/adverts/${listing.olxAdvertId}/activate`, {})
        .catch(() => {});
    }
    await ListingRepository.markSold(listing.id);
    await PriceHistoryRepository.add(listing.id, listing.price, 'sold');
  },
};
