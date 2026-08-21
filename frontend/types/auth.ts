export type UserRole = "admin" | "user";

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  lastLoginAt?: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
