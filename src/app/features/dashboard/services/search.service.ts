import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiBaseService } from '@core/services/api-base.service';
import { HttpClient } from '@angular/common/http';
import { AppStateStore } from '@core/services/app-state.store';
import { LoggerService } from '@core/services/logger.service';
import { SearchRequest, SearchResponse } from '../models/search.model';
import { MenuItem } from '../models/menu-item.model';
import menuItemConfigData from '../../../../assets/data/menu-item-ids.json';

@Injectable({
  providedIn: 'root',
})
export class SearchService extends ApiBaseService {
  private menuItemConfigs: Record<string, { route?: string }> =
    (menuItemConfigData as Record<string, { route?: string }>) || {};

  constructor(http: HttpClient, appState: AppStateStore, logger: LoggerService) {
    super(http, appState, logger);
  }

  // Search based on selected option and query
  search(
    option: MenuItem | undefined,
    child: MenuItem | undefined,
    query: string,
    overrideBody?: SearchRequest
  ): Observable<SearchResponse> {
    const configId = child?.id || option?.id || '';
    const configRoute = configId ? this.menuItemConfigs[configId]?.route : undefined;
    const searchType = this.getSearchType(option, child);
    const menuValue = child?.value || option?.value || '';
    const requestBody = overrideBody ?? this.buildSearchRequest(menuValue, query);
    const endpoint = configRoute ? `/search${configRoute}` : `/search/${searchType}`;

    return this.post<SearchResponse>(endpoint, requestBody, 'search');
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
      'bank-account': 'bank-lookup',
      'bank-account-search': 'bank-lookup',
      'virtual-no-email-mobile': 'virtual-number',
      'virtual-no-email-email': 'virtual-email',
      'vehicle-search': 'vehicle-lookup',
      'rc-search': 'vehicle-lookup',
      'chassis-rc': 'vehicle-lookup',
      'fasttag-history': 'vehicle-lookup',
      pan: 'verify-id',
      'driving-license': 'verify-id',
      'voter-id': 'verify-id',
      passport: 'verify-id',
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
        is_advance: true,
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

    // Handle virtual number/email lookups
    if (menuValue === 'virtual-no-email-mobile') {
      return {
        phone_number: trimmedQuery,
      } as SearchRequest;
    }

    if (menuValue === 'virtual-no-email-email') {
      return {
        email: trimmedQuery,
      };
    }

    // Handle vehicle lookups
    if (
      menuValue === 'rc-search' ||
      menuValue === 'vehicle-search' ||
      menuValue === 'fasttag-history'
    ) {
      return {
        vehicle_number: trimmedQuery,
        lookup_type: 'all',
      } as SearchRequest;
    }

    if (menuValue === 'chassis-rc') {
      return {
        chassis_number: trimmedQuery,
        lookup_type: 'all',
      } as SearchRequest;
    }

    // Handle verify-id
    if (
      menuValue === 'pan' ||
      menuValue === 'driving-license' ||
      menuValue === 'voter-id' ||
      menuValue === 'passport'
    ) {
      return {
        id_type: menuValue,
        value: trimmedQuery,
        dob: null,
      } as SearchRequest;
    }

    // For other types, return generic query
    return {
      query: trimmedQuery,
    };
  }
}
