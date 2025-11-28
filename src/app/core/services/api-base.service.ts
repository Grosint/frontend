import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { switchMap, retry, catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '@environments/environment';
import { AppStateStore } from './app-state.store';
import { LoggerService } from './logger.service';

/**
 * Base service for API operations using RxJS
 * Provides common patterns: retry, loading states, error handling
 */
@Injectable({
  providedIn: 'root'
})
export class ApiBaseService {
  protected readonly apiUrl = environment.apiUrl;

  constructor(
    protected http: HttpClient,
    protected appState: AppStateStore,
    protected logger: LoggerService
  ) {}

  /**
   * Generic request with loading states and retry logic
   */
  protected request<T>(
    method: string,
    url: string,
    options?: any,
    taskId?: string
  ): Observable<T> {
    const id = taskId || `api-${Date.now()}`;
    const fullUrl = url.startsWith('http') ? url : `${this.apiUrl}${url}`;

    // Ensure we get the body, not the full HttpEvent
    const requestOptions = {
      ...options,
      observe: 'body' as const
    };

    return timer(0).pipe(
      tap(() => this.appState.startLoading(id)),
      switchMap(() => this.http.request<T>(method, fullUrl, requestOptions) as Observable<T>),
      retry({
        count: 3,
        delay: (error, retryCount) => {
          this.logger.warn(`Retry attempt ${retryCount} for ${method} ${url}`);
          return timer(Math.min(1000 * Math.pow(2, retryCount), 10000));
        }
      }),
      catchError(error => {
        this.logger.error(`Request failed: ${method} ${url}`, error);
        return throwError(() => error);
      }),
      finalize(() => this.appState.stopLoading(id))
    );
  }

  /**
   * GET request
   */
  protected get<T>(url: string, params?: any, taskId?: string): Observable<T> {
    const httpParams = this.buildParams(params);
    return this.request<T>('GET', url, { params: httpParams }, taskId);
  }

  /**
   * POST request
   */
  protected post<T>(url: string, body: any, taskId?: string): Observable<T> {
    return this.request<T>('POST', url, { body }, taskId);
  }

  /**
   * PUT request
   */
  protected put<T>(url: string, body: any, taskId?: string): Observable<T> {
    return this.request<T>('PUT', url, { body }, taskId);
  }

  /**
   * PATCH request
   */
  protected patch<T>(url: string, body: any, taskId?: string): Observable<T> {
    return this.request<T>('PATCH', url, { body }, taskId);
  }

  /**
   * DELETE request
   */
  protected delete<T>(url: string, taskId?: string): Observable<T> {
    return this.request<T>('DELETE', url, undefined, taskId);
  }

  /**
   * Build HTTP params from object
   */
  private buildParams(params: any): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    return httpParams;
  }
}
