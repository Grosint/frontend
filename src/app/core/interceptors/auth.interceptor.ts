import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { LoggerService } from '../services/logger.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private auth: AuthService,
    private router: Router,
    private logger: LoggerService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Skip auth for login/register endpoints
    if (req.url.includes('/auth/login') || req.url.includes('/auth/register')) {
      return next.handle(req);
    }

    const token = this.auth.getToken();

    // Clone request and add auth header
    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized
        if (error.status === 401) {
          // Try to refresh token
          const refreshToken = this.auth.getRefreshToken();
          if (refreshToken) {
            return this.auth.refreshToken().pipe(
              switchMap(() => {
                // Retry original request with new token
                const newToken = this.auth.getToken();
                const retryReq = req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newToken}`
                  }
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
