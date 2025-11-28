import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiBaseService } from './api-base.service';
import { AppStateStore } from './app-state.store';
import { LoggerService } from './logger.service';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends ApiBaseService {
  private readonly tokenKey = 'auth_token';
  private readonly refreshTokenKey = 'refresh_token';

  constructor(
    http: HttpClient,
    appState: AppStateStore,
    logger: LoggerService,
    private router: Router
  ) {
    super(http, appState, logger);
    this.loadUserFromStorage();
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.post<AuthResponse>('/auth/login', credentials, 'login').pipe(
      tap(response => {
        this.setAuthData(response);
        this.appState.setUser(response.user);
      }),
      catchError(error => {
        this.logger.error('Login failed', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Register new user
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.post<AuthResponse>('/auth/register', data, 'register').pipe(
      tap(response => {
        this.setAuthData(response);
        this.appState.setUser(response.user);
      }),
      catchError(error => {
        this.logger.error('Registration failed', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Logout user
   */
  logout(): void {
    this.clearAuthData();
    this.appState.reset();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken() && this.appState.isAuthenticated();
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.post<AuthResponse>('/auth/refresh', { refreshToken }, 'refresh-token').pipe(
      tap(response => {
        this.setAuthData(response);
      }),
      catchError(error => {
        this.logger.error('Token refresh failed', error);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current user
   */
  getCurrentUser(): Observable<User> {
    return this.get<User>('/auth/me', undefined, 'get-current-user').pipe(
      tap(user => this.appState.setUser(user)),
      catchError(error => {
        this.logger.error('Failed to get current user', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Set authentication data
   */
  private setAuthData(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    if (response.refreshToken) {
      localStorage.setItem(this.refreshTokenKey, response.refreshToken);
    }
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
  }

  /**
   * Load user from storage on app init
   */
  private loadUserFromStorage(): void {
    const token = this.getToken();
    if (token) {
      // Try to get user info from API
      this.getCurrentUser().subscribe({
        error: () => {
          // If failed, clear invalid token
          this.clearAuthData();
        }
      });
    }
  }
}
