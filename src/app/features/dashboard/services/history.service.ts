import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiBaseService } from '@core/services/api-base.service';

export interface SearchHistoryItem {
  id: string;
  queryType: string;
  queryInput: string;
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

@Injectable({
  providedIn: 'root',
})
export class HistoryService extends ApiBaseService {
  getHistory(page = 1, size = 10): Observable<SearchHistoryResponse> {
    return this.get<SearchHistoryResponse>('/history/', { page, size }, 'history').pipe(
      catchError(error => {
        this.logger.error('History fetch failed', error);
        return throwError(() => error);
      })
    );
  }
}
