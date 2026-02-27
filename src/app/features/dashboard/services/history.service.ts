import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiBaseService } from '@core/services/api-base.service';
import { SearchResultItem } from '../models/search.model';

export interface SearchHistoryItem {
  id: string;
  queryType: string;
  queryInput: string | Record<string, unknown>;
  status: string;
  createdAt: string;
}

export interface SearchHistoryResponse {
  success: boolean;
  message?: string;
  data: SearchHistoryItem[];
  pagination?: {
    page: number;
    size: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

export interface SearchHistoryDetailResponse {
  success: boolean;
  message?: string;
  timestamp?: string;
  data: {
    id: string;
    userId: string;
    queryType: string;
    queryInput: string;
    status: string;
    flattenedResults: SearchResultItem[];
    metadata?: Record<string, unknown>;
    createdAt: string;
    updatedAt: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class HistoryService extends ApiBaseService {
  getHistory(
    page = 1,
    size = 10,
    searchType?: string,
    userId?: string
  ): Observable<SearchHistoryResponse> {
    const params: Record<string, unknown> = { page, size };
    if (searchType) {
      params['searchType'] = searchType;
    }
    if (userId) {
      params['user_id'] = userId;
    }
    return this.get<SearchHistoryResponse>('/history/', params, 'history').pipe(
      catchError(error => {
        this.logger.error('History fetch failed', error);
        return throwError(() => error);
      })
    );
  }

  getHistoryById(historyId: string): Observable<SearchHistoryDetailResponse> {
    return this.get<SearchHistoryDetailResponse>(
      `/history/${historyId}`,
      undefined,
      'history-detail'
    ).pipe(
      catchError(error => {
        this.logger.error('History detail fetch failed', error);
        return throwError(() => error);
      })
    );
  }
}
