export type ListingStatus = 'draft' | 'active' | 'sold' | 'expired' | 'paused';
export type Condition = 'nowy' | 'używany_dobry' | 'używany_dostateczny' | 'używany_zły';

export const CONDITION_LABELS: Record<Condition, string> = {
  nowy: 'Nowy',
  używany_dobry: 'Używany — dobry',
  używany_dostateczny: 'Używany — dostateczny',
  używany_zły: 'Używany — zły',
};
export type WizardStep = 'document' | 'upload' | 'metadata' | 'analysis' | 'pricing' | 'review';

export interface DocumentExtractResult {
  itemName?: string;
  brand?: string;
  model?: string;
  yearOfProduction?: string;
  serialNumber?: string;
  specs?: string;
  purchasePrice?: number;
  purchaseDate?: string;
  additionalInfo?: string;
}

export interface ItemMetadata {
  itemName: string;
  model: string;
  yearOfProduction: string;
  category: string;
  additionalInfo: string;
}

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
  priceHistory?: PriceHistoryEntry[];
}

export type VerificationElement = 'title' | 'description' | 'price' | 'photos' | 'shipping' | 'city' | 'condition';
export type VerificationSeverity = 'error' | 'warning' | 'tip';

export interface VerificationSuggestion {
  id: string;
  element: VerificationElement;
  severity: VerificationSeverity;
  title: string;
  message: string;
  newValue?: string;
}

export interface VerificationResult {
  score: number;
  suggestions: VerificationSuggestion[];
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

export interface ListingWithDescription extends SimilarListing {
  description: string;
}

export interface PriceSuggestion {
  suggestedPrice: number;
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  sampleSize: number;
  similarListings: SimilarListing[];
}

export interface PhotoAnalysisResult {
  title: string;
  description: string;
  condition: string;
  suggestedCategory: string;
  keywords: string[];
  officialUrl?: string;
  estimatedPriceRange?: { min: number; max: number };
}
