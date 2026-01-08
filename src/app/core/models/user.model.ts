// Base API Response wrapper
interface BaseApiResponse<T> {
  success: boolean;
  message: string;
  timestamp: string;
  data: T;
}

// Base user profile fields (for response data)
export interface BaseUserProfileData {
  id: string;
  email: string;
  phone?: string;
  userType?: string;
  features?: string[];
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  pinCode?: string;
  state?: string;
  organizationId?: string | null;
  orgName?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Base profile fields (for request objects)
interface BaseProfileFields {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  pinCode?: string;
  state?: string;
  phone?: string;
}

// User interface
export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  pinCode?: string;
  state?: string;
  phone?: string;
  avatar?: string;
  permissions?: string[];
  role?: string;
  createdAt?: string;
  updatedAt?: string;
  userType?: string;
  isVerified?: boolean;
}

// Login API Response
export interface LoginApiResponse extends BaseApiResponse<{
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user_id: string;
  email: string;
}> {}

// Auth Response
export interface AuthResponse {
  token: string;
  user: User;
  refreshToken?: string;
  expiresIn?: number;
}

// Login Request
export interface LoginRequest {
  phone: string;
  password: string;
}

// Signup Request
export interface SignupRequest extends BaseProfileFields {
  email: string;
  phone: string;
  verifyByGovId: boolean;
  password: string;
  userType: string;
  firstName: string;
  lastName: string;
  address?: string;
  city?: string;
  pinCode?: string;
  state?: string;
  organizationId: string | null;
  orgName: string | null;
}

// Signup Response
export interface SignupResponse extends BaseApiResponse<BaseUserProfileData> {}

// OTP Verification Request
export interface OtpVerificationRequest {
  email: string;
  otp: string;
}

// OTP Verification Response
export interface OtpVerificationResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
}

// Refresh Token API Response
export interface RefreshTokenApiResponse extends BaseApiResponse<{
  access_token: string;
  token_type: string;
  expires_in: number;
}> {}

// Update Profile Request
export interface UpdateProfileRequest extends BaseProfileFields {}

// Update Profile Response
export interface UpdateProfileResponse extends BaseApiResponse<BaseUserProfileData> {}

// Get User Profile Response
export interface GetUserProfileResponse extends BaseApiResponse<BaseUserProfileData> {}

// Change Password Request
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Change Password Response
export interface ChangePasswordResponse extends BaseApiResponse<{
  message: string;
  changed_at: string;
}> {}
