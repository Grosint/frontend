export interface User {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  permissions?: string[];
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
    user_id: string;
    email: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string;
  expiresIn?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  phone: string;
  verifyByGovId: boolean;
  password: string;
  userType: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  pinCode: string;
  state: string;
  organizationId: string | null;
  orgName: string | null;
}

export interface OtpVerificationRequest {
  email: string;
  otp: string;
}

export interface OtpVerificationResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

export interface RefreshTokenApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    access_token: string;
    token_type: string;
    expires_in: number;
  };
}

export interface CurrentUserApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
  data: {
    is_authenticated: boolean;
    user_id: string;
    email: string;
    token_type: string;
    expires_at: string;
  };
}
