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
  itemName?: string;
  model?: string;
  yearOfProduction?: string;
  category?: string;
  additionalInfo?: string;
}

export interface PhotoAnalysisResult {
  title: string;
  description: string;
  condition: 'nowy' | 'używany_dobry' | 'używany_dostateczny' | 'używany_zły';
  suggestedCategory: string;
  keywords: string[];
  officialUrl?: string;
  estimatedPriceRange?: { min: number; max: number };
}
