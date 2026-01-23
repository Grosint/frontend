export interface SearchRequest {
  phone?: string;
  country_code?: string;
  email?: string;
  ip?: string;
  imei?: string;
  query?: string;
  is_advance?: boolean;
}

export interface SearchResultItem {
  source: string;
  type?: string;
  value?: string;
  showSource?: boolean;
  category?: string;
  found?: boolean;
  data?: string | null;
  confidence?: number;
  breach_source?: string;
  groupBy?: string;
  metadata?: Record<string, unknown>;
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
