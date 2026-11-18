export type UserRole = 'customer' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'banned';

export interface User {
  user_id: string;
  fullname: string;
  email: string;
  avatar?: string | null;
  phone?: string | null;
  role: UserRole;
  status: UserStatus;
  oauth_provider: string;
  oauth_id?: string | null;
  email_verified_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password?: string;
}

export interface SignupRequest {
  fullname: string;
  email: string;
  password?: string;
  phone?: string;
}

export interface GoogleLoginRequest {
  googleId: string;
  email: string;
  fullname: string;
  avatar?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token?: string;
  };
}
