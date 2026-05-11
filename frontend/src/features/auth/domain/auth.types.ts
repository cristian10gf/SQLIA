export type UserRole = 'ADMIN' | 'PROFESSOR' | 'STUDENT';

export type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
};