import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

const publicEndpointPatterns = [
  /\/auth\/login$/,
  /\/auth\/register$/,
  /\/auth\/signup$/,
  /\/auth\/verify-otp$/,
  /\/user$/, // Exact match for signup only
  /\/auth\/resend$/,
  /\/auth\/resend-otp$/,
  /\/auth\/send-otp$/,
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private auth: AuthService,
    private logger: LoggerService
  ) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip auth for login/register endpoints

    const urlPath = new URL(req.url, 'http://dummy').pathname;
    const isPublicEndpoint = publicEndpointPatterns.some(pattern => pattern.test(urlPath));

    if (isPublicEndpoint) return next.handle(req);

    const token = this.auth.getToken();

    // Clone request and add auth header
    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized
        if (error.status === 401) {
          if (req.url.includes('/auth/change-password'))
            // Return error immediately without token refresh retry
            return throwError(() => error);

          // Try to refresh token
          const refreshToken = this.auth.getRefreshToken();
          if (refreshToken) {
            return this.auth.refreshToken().pipe(
              switchMap(() => {
                // Retry original request with new token
                const newToken = this.auth.getToken();
                if (!newToken) {
                  this.logger.error('Token refresh succeeded but no token received');
                  this.auth.logout();
                  return throwError(() => new Error('No token available after refresh'));
                }
                const retryReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`,
                  },
                });
                return next.handle(retryReq);
              }),
              catchError(refreshError => {
                // Refresh failed, logout user
                this.logger.error('Token refresh failed in interceptor', refreshError);
                this.auth.logout();
                return throwError(() => refreshError);
              })
            );
          } else {
            // No refresh token, logout
            this.auth.logout();
          }
        }

        return throwError(() => error);
      })
    );
  }
}
