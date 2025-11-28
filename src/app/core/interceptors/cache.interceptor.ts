import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

interface CacheEntry {
  data: any;
  timestamp: number;
}

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  private cache = new Map<string, CacheEntry>();
  private readonly cacheTTL = 5 * 60 * 1000; // 5 minutes

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next.handle(req);
    }

    // Check if request should be cached
    const cacheKey = req.urlWithParams;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      // Return cached data
      return of(cached.data);
    }

    // Make request and cache response
    return next.handle(req).pipe(
      tap(event => {
        if (event.type === 4) { // HttpResponse
          this.cache.set(cacheKey, {
            data: event,
            timestamp: Date.now()
          });
        }
      })
    );
  }

  clearCache(): void {
    this.cache.clear();
  }

  clearCacheForUrl(url: string): void {
    this.cache.delete(url);
  }
}
