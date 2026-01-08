export interface SearchRequest {
  phone?: string;
  country_code?: string;
  email?: string;
  ip?: string;
  imei?: string;
  query?: string;
  // Add other search types as needed
}

export interface SearchResultItem {
  source: string;
  type?: string;
  value?: string;
  showSource?: boolean;
  category?: string;
  found?: boolean;
  data?: unknown;
  confidence?: number;
}

export interface SearchResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    search_id: string;
    phone?: string;
    country_code?: string;
    email?: string;
    status: string;
    results_count: number;
    failed_count: number;
    error_message?: string;
    results: SearchResultItem[];
    created_at: string;
    updated_at: string;
  };
}
