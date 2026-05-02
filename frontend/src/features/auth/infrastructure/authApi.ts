import { apiClient } from '../../../shared/infrastructure/http/apiClient';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
} from '../domain/auth.types';

export const authApi = {
  login(payload: LoginRequest) {
    return apiClient.post<AuthResponse>('/auth/login', payload);
  },

  register(payload: RegisterRequest) {
    return apiClient.post<AuthResponse>('/auth/register', payload);
  },

  profile(token: string) {
    return apiClient.get<AuthResponse['user']>('/auth/profile', token);
  },
};