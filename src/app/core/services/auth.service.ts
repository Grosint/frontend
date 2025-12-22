import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, map, take } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiBaseService } from './api-base.service';
import { AppStateStore } from './app-state.store';
import { LoggerService } from './logger.service';
import {
  AuthResponse,
  LoginRequest,
  LoginApiResponse,
  OtpVerificationRequest,
  SignupRequest,
  User,
} from '../models/user.model';

export interface SignupResponse {
  success: boolean;
  message?: string;
}

export interface ResendOtpRequest {
  email: string;
}

export interface ResendOtpResponse {
  success: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService extends ApiBaseService {
  private readonly tokenKey = 'auth_token';
  private readonly refreshTokenKey = 'refresh_token';
  private readonly userKey = 'user_data';

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
    return this.post<LoginApiResponse>('/auth/login', credentials, 'login').pipe(
      map(apiResponse => this.mapAuthResponse(apiResponse)),
      tap(response => {
        this.setAuthData(response);
        this.appState.setUser(response.user);
      }),
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Login failed', err);
        return throwError(() => error);
      })
    );
  }

  /**
   * Signup new user
   */
  signup(data: SignupRequest): Observable<SignupResponse> {
    return this.post<any>('/user', data, 'signup').pipe(
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Signup failed', err);
        return throwError(() => error);
      })
    );
  }

  /**
   * Verify OTP
   */
  verifyOtp(data: OtpVerificationRequest): Observable<AuthResponse> {
    return this.post<LoginApiResponse>('/auth/verify-otp', data, 'verify-otp').pipe(
      map(apiResponse => this.mapAuthResponse(apiResponse)),
      tap(response => {
        this.setAuthData(response);
        this.appState.setUser(response.user);
      }),
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('OTP verification failed', err);
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
    const token = this.getToken();
    if (!token) {
      return false;
    }

    if (!this.appState.isAuthenticated()) {
      const storedUser = this.getStoredUser();
      if (storedUser) {
        this.appState.setUser(storedUser);
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.post<LoginApiResponse>('/auth/refresh', { refreshToken }, 'refresh-token').pipe(
      map(apiResponse => this.mapAuthResponse(apiResponse)),
      tap(response => {
        this.setAuthData(response);
        this.appState.setUser(response.user);
      }),
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Token refresh failed', err);
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
      tap(user => {
        this.appState.setUser(user);
        localStorage.setItem(this.userKey, JSON.stringify(user));
      }),
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Failed to get current user', err);
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
    if (response.user) {
      localStorage.setItem(this.userKey, JSON.stringify(response.user));
    }
  }

  /**
   * Get stored user from localStorage
   */
  private getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.userKey);
      if (userStr) {
        return JSON.parse(userStr) as User;
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.logger.error('Failed to parse stored user data', err);
    }
    return null;
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  /**
   * Load user from storage on app init
   */
  private loadUserFromStorage(): void {
    const token = this.getToken();
    if (token) {
      const storedUser = this.getStoredUser();
      if (storedUser) {
        this.appState.setUser(storedUser);
      }

      this.getCurrentUser()
        .pipe(take(1))
        .subscribe({
          next: () => {
            this.logger.info('User data refreshed from API');
          },
          error: (error: unknown) => {
            if (this.isHttpErrorResponse(error) && error.status === 401) {
              this.clearAuthData();
              this.appState.reset();
            }
          },
        });
    }
  }

  resendOtp(email: string): Observable<ResendOtpResponse> {
    return this.post<ResendOtpResponse>('/auth/resend-otp', { email }, 'resend-otp').pipe(
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Resend OTP failed', err);
        return throwError(() => error);
      })
    );
  }

  private mapAuthResponse(apiResponse: LoginApiResponse): AuthResponse {
    return {
      token: apiResponse.data.access_token,
      refreshToken: apiResponse.data.refresh_token,
      expiresIn: apiResponse.data.expires_in,
      user: {
        id: apiResponse.data.user_id,
        email: apiResponse.data.email,
        name: apiResponse.data.email.split('@')[0],
      },
    };
  }

  private isHttpErrorResponse(error: unknown): error is { status: number } {
    return error !== null && typeof error === 'object' && 'status' in error;
  }
}
