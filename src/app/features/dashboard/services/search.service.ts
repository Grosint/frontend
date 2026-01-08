import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import { HttpClient } from '@angular/common/http';
import { AppStateStore } from '@core/services/app-state.store';
import { LoggerService } from '@core/services/logger.service';
import { SearchRequest, SearchResponse } from '../models/search.model';
import { MenuItem } from '../models/menu-item.model';

@Injectable({
  providedIn: 'root',
})
export class SearchService extends ApiBaseService {
  constructor(http: HttpClient, appState: AppStateStore, logger: LoggerService) {
    super(http, appState, logger);
  }

  // Search based on selected option and query
  search(
    option: MenuItem | undefined,
    child: MenuItem | undefined,
    query: string
  ): Observable<SearchResponse> {
    const searchType = this.getSearchType(option, child);
    const menuValue = child?.value || option?.value || '';
    const requestBody = this.buildSearchRequest(menuValue, query);

    return this.post<SearchResponse>(`/search/${searchType}`, requestBody, 'search');
  }

  // Determine search type endpoint from menu selection
  private getSearchType(option: MenuItem | undefined, child: MenuItem | undefined): string {
    if (!option) {
      throw new Error('No option selected');
    }

    // If child is selected, use child value, otherwise use parent value
    const type = child?.value || option.value;

    // Map menu values to API endpoints
    const typeMap: Record<string, string> = {
      mobile: 'phone-lookup',
      'mobile-verify-search': 'phone-lookup',
      email: 'email-lookup',
      'ip-search': 'ip-lookup',
      'imei-search': 'imei-lookup',
      // Add more mappings as needed
    };

    return typeMap[type] || type;
  }

  // Build search request body based on menu value
  private buildSearchRequest(menuValue: string, query: string): SearchRequest {
    const trimmedQuery = query.trim();

    // Handle mobile - use query as-is, default country code to +91
    if (menuValue.includes('mobile')) {
      return {
        phone: trimmedQuery,
        country_code: '+91',
      };
    }

    // Handle email
    if (menuValue === 'email') {
      return {
        email: trimmedQuery,
      };
    }

    // Handle IP search
    if (menuValue === 'ip-search') {
      return {
        ip: trimmedQuery,
      };
    }

    // Handle IMEI search
    if (menuValue === 'imei-search') {
      return {
        imei: trimmedQuery,
      };
    }

    // For other types, return generic query
    return {
      query: trimmedQuery,
    };
  }
}
