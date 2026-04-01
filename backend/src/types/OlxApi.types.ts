export interface OlxTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface OlxStoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface OlxAdvertCreateRequest {
  title: string;
  description: string;
  category_id: number;
  advertiser_type: 'private' | 'business';
  contact: { name: string; phone?: string };
  location: { city_id: number; district_id?: number };
  attributes: Array<{ code: string; value: string | number }>;
  price?: { value: number; currency: 'PLN'; negotiable?: boolean };
  images?: Array<{ url: string }>;
  external_id?: string;
}

export interface OlxAdvertResponse {
  id: string;
  status: string;
  url?: string;
  valid_to?: string;
  title: string;
  description: string;
  price?: { value: number; currency: string };
  category?: { id: number };
}

export interface OlxCategory {
  id: number;
  name: string;
  parent_id?: number;
  is_leaf: boolean;
}

export interface OlxCategoryAttribute {
  code: string;
  label: string;
  unit?: string;
  validation?: { required: boolean; numeric?: boolean };
  values?: Array<{ code: string; label: string }>;
}
