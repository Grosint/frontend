import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, map, take, finalize } from 'rxjs/operators';
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
  RefreshTokenApiResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  SignupResponse,
  SignupInitResponse,
  GetUserProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  LogoutResponse,
  BaseUserProfileData,
  OtpVerificationResponse,
} from '../models/user.model';

export interface ResendOtpResponse {
  success: boolean;
  message?: string;
  data?: {
    message?: string;
    expires_in?: number;
  };
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

  // Login user
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.post<LoginApiResponse>('/auth/login', credentials, 'login').pipe(
      map(apiResponse => this.mapAuthResponse(apiResponse, credentials.email)),
      tap(response => {
        this.setAuthData(response);
        this.appState.setUser(response.user);

        // Load full user profile after successful login
        this.getCurrentUser()
          .pipe(take(1))
          .subscribe({
            next: () => {
              this.logger.info('User profile loaded after login');
            },
            error: error => {
              // Log error but don't block the flow
              this.logger.error('Failed to load user profile after login', error);
            },
          });
      }),
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Login failed', err);
        return throwError(() => error);
      })
    );
  }

  // Signup new user
  signup(data: SignupRequest): Observable<SignupResponse> {
    return this.put<SignupResponse>('/user/signup/complete', data, 'signup-complete').pipe(
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Signup failed', err);
        return throwError(() => error);
      })
    );
  }

  // Signup init (email-only) for pre-signup flow
  signupInit(email: string): Observable<SignupInitResponse> {
    return this.post<SignupInitResponse>('/user/signup/init', { email }, 'signup-init').pipe(
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Signup init failed', err);
        return throwError(() => error);
      })
    );
  }

  // Verify OTP
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

  // Verify OTP without logging in (pre-signup email verification)
  verifyEmailOtp(data: OtpVerificationRequest): Observable<OtpVerificationResponse> {
    return this.post<OtpVerificationResponse>('/auth/verify-otp', data, 'verify-email-otp').pipe(
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Email OTP verification failed', err);
        return throwError(() => error);
      })
    );
  }

  // Logout user and redirect to login page
  logout(): void {
    const refreshToken = this.getRefreshToken();
    const payload = refreshToken ? { refresh_token: refreshToken } : {};

    this.post<LogoutResponse>('/auth/logout', payload, 'logout')
      .pipe(
        take(1),
        catchError((error: unknown) => {
          const err = error instanceof Error ? error : new Error(String(error));
          this.logger.error('Logout failed', err);
          return throwError(() => error);
        }),
        finalize(() => {
          this.clearAuthData();
          this.appState.reset();
          this.router.navigate(['/auth/login']);
        })
      )
      .subscribe();
  }

  // Get current token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  // Get refresh token
  getRefreshToken(): string | null {
    return localStorage.getItem(this.refreshTokenKey);
  }

  // Check if user is authenticated
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

  // Refresh access token
  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.post<RefreshTokenApiResponse>(
      '/auth/refresh',
      { refresh_token: refreshToken },
      'refresh-token'
    ).pipe(
      map(apiResponse => {
        const existingUser = this.getStoredUser();

        if (!existingUser) {
          throw new Error('No user data found');
        }

        // Refresh token response only provides new access_token
        // Keep existing refresh_token and user data
        return {
          token: apiResponse.data.access_token,
          refreshToken: refreshToken, // Keep existing refresh token
          expiresIn: apiResponse.data.expires_in,
          user: existingUser, // Preserve existing user data
        } as AuthResponse;
      }),
      tap(response => {
        // Only update access token, preserve refresh token and user
        localStorage.setItem(this.tokenKey, response.token);
        // Don't update refresh token - it's not in the response
        // Don't update user - it's not in the response
        // Just ensure user is set in app state
        if (response.user) {
          this.appState.setUser(response.user);
        }
      }),
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Token refresh failed', err);
        this.logout();
        return throwError(() => error);
      })
    );
  }

  // Get current user
  getCurrentUser(): Observable<User> {
    return this.get<GetUserProfileResponse>('/user/me', undefined, 'get-current-user').pipe(
      map(apiResponse => {
        // Extract user data from API response and transform to User object
        return this.mapUserDataToUser(apiResponse.data);
      }),
      tap(user => {
        // Store the User object with all profile fields
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

  // Set authentication data
  private setAuthData(response: AuthResponse): void {
    // Store access token
    if (response.token && typeof response.token === 'string') {
      localStorage.setItem(this.tokenKey, response.token);
    }

    // Only update refresh token if new one is provided
    if (response.refreshToken && typeof response.refreshToken === 'string') {
      localStorage.setItem(this.refreshTokenKey, response.refreshToken);
    }

    // Only update user if provided and it's a proper User object
    if (
      response.user &&
      typeof response.user === 'object' &&
      response.user.id &&
      response.user.email
    ) {
      // Preserve existing user fields that might not be in response
      const existingUser = this.getStoredUser();
      const userToStore: User = {
        ...existingUser, // Preserve existing fields (including profile fields)
        ...response.user, // Override with new data
        id: response.user.id,
        email: response.user.email,
        // Preserve profile fields from existing user if not in response
        firstName: response.user.firstName ?? existingUser?.firstName,
        lastName: response.user.lastName ?? existingUser?.lastName,
        address: response.user.address ?? existingUser?.address,
        city: response.user.city ?? existingUser?.city,
        pinCode: response.user.pinCode ?? existingUser?.pinCode,
        state: response.user.state ?? existingUser?.state,
        phone: response.user.phone ?? existingUser?.phone,
        // Preserve name if not in response
        name: response.user.name ?? existingUser?.name ?? response.user.email.split('@')[0],
        // Preserve other fields
        avatar: response.user.avatar ?? existingUser?.avatar,
        permissions: response.user.permissions ?? existingUser?.permissions,
        role: response.user.role ?? existingUser?.role,
        createdAt: response.user.createdAt ?? existingUser?.createdAt,
        updatedAt: response.user.updatedAt ?? existingUser?.updatedAt,
      };

      localStorage.setItem(this.userKey, JSON.stringify(userToStore));
    }
  }

  // Get stored user from localStorage
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

  // Clear authentication data
  private clearAuthData(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.userKey);
  }

  // Load user from storage on app init
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

  sendOtp(email: string): Observable<ResendOtpResponse> {
    return this.post<ResendOtpResponse>('/auth/send-otp', { email }, 'send-otp').pipe(
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Send OTP failed', err);
        return throwError(() => error);
      })
    );
  }

  updateProfile(data: UpdateProfileRequest): Observable<UpdateProfileResponse> {
    return this.put<UpdateProfileResponse>('/user/me', data, 'update-profile').pipe(
      tap(response => {
        // Update user in app state with all fields from API response
        const updatedUser = this.mapUserDataToUser(response.data);

        this.appState.updateUserProfile(updatedUser);
        // Also update localStorage
        localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
      }),
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Update profile failed', err);
        return throwError(() => error);
      })
    );
  }

  changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.post<ChangePasswordResponse>('/auth/change-password', data, 'change-password').pipe(
      catchError((error: unknown) => {
        const err = error instanceof Error ? error : new Error(String(error));
        this.logger.error('Change password failed', err);
        return throwError(() => error);
      })
    );
  }

  private mapAuthResponse(apiResponse: LoginApiResponse, emailHint?: string): AuthResponse {
    const storedUser = this.getStoredUser();
    const email = apiResponse.data.email || storedUser?.email || emailHint || '';
    const userId = apiResponse.data.user_id || storedUser?.id || email || 'unknown';
    return {
      token: apiResponse.data.access_token,
      refreshToken: apiResponse.data.refresh_token,
      expiresIn: apiResponse.data.expires_in,
      user: {
        id: userId,
        email,
        name: email ? email.split('@')[0] : storedUser?.name,
      },
    };
  }

  private mapUserDataToUser(userData: BaseUserProfileData): User {
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      address: userData.address,
      city: userData.city,
      pinCode: userData.pinCode,
      state: userData.state,
      phone: userData.phone,
      userType: userData.userType,
      isVerified: userData.isVerified,
      name:
        userData.firstName && userData.lastName
          ? `${userData.firstName} ${userData.lastName}`
          : userData.email.split('@')[0],
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
    } as User;
  }

  private isHttpErrorResponse(error: unknown): error is { status: number } {
    return error !== null && typeof error === 'object' && 'status' in error;
  }
}
