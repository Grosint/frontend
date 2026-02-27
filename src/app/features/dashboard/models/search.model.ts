export interface SearchRequest {
  phone?: string;
  country_code?: string;
  email?: string;
  ip?: string;
  imei?: string;
  vehicle_number?: string;
  chassis_number?: string;
  lookup_type?: string;
  account_no?: string;
  ifsc_code?: string;
  id_type?: string;
  value?: string;
  dob?: string | null;
  phone_number?: string;
  query_type?: string;
  query_data?: string;
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
