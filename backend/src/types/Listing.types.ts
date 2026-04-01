export type ListingStatus = 'draft' | 'active' | 'sold' | 'expired' | 'paused';

export type Condition = 'nowy' | 'używany_dobry' | 'używany_dostateczny' | 'używany_zły';

export interface Listing {
  id: number;
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;
  price: number;
  currency: 'PLN';
  status: ListingStatus;
  condition: Condition;
  city: string;
  negotiable: boolean;
  shipping: boolean;
  olxAdvertId?: string;
  olxAdvertUrl?: string;
  photos: string[];
  aiGeneratedDescription: string;
  reductionPercent: number;
  reductionIntervalDays: number;
  nextReductionAt?: string;
  publishedAt?: string;
  soldAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceHistoryEntry {
  id: number;
  listingId: number;
  price: number;
  reason: 'initial' | 'manual' | 'auto_reduction' | 'sold';
  recordedAt: string;
}

export interface SimilarListing {
  olxId: string;
  title: string;
  price: number;
  url: string;
  thumbnailUrl?: string;
  locationCity?: string;
}

export interface PriceSuggestion {
  suggestedPrice: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  sampleSize: number;
  similarListings: SimilarListing[];
}

export interface CreateListingDto {
  title: string;
  description: string;
  categoryId: number;
  categoryName: string;
  price: number;
  photos: string[];
  condition?: Condition;
  city?: string;
  negotiable?: boolean;
  shipping?: boolean;
  aiGeneratedDescription?: string;
  reductionPercent?: number;
  reductionIntervalDays?: number;
}

export interface UpdateListingDto {
  title?: string;
  description?: string;
  categoryId?: number;
  categoryName?: string;
  price?: number;
  condition?: Condition;
  city?: string;
  negotiable?: boolean;
  shipping?: boolean;
  reductionPercent?: number;
  reductionIntervalDays?: number;
}
