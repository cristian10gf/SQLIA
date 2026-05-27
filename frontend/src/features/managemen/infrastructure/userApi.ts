import { apiClient } from '../../../shared/infrastructure/http/apiClient';

export type UserRole = 'ADMIN' | 'PROFESSOR' | 'STUDENT';

export type ApiUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  createdAt?: string;
};

export type ApiUserDetail = ApiUser & {
  enrollments?: { courseId: string; courseName?: string; enrolledAt?: string }[];
};

export type ImportCsvResult = {
  total: number;
  created: number;
  alreadyExisted: number;
  errors: string[];
};

type UserListResponse = {
  meta: { total: number; page: number; lastPage: number };
  data: ApiUser[];
};

type CreateUserPayload = {
  email: string;
  password: string;
  fullName: string;
  role: 'PROFESSOR' | 'STUDENT';
};

type UpdateUserPayload = {
  email?: string;
  fullName?: string;
  role?: UserRole;
  password?: string;
};

export const userApi = {
  findAll(token: string, page = 1, limit = 100) {
    return apiClient.get<UserListResponse>(
      `/users?page=${page}&limit=${limit}`,
      token,
    );
  },

  findById(userId: string, token: string) {
    return apiClient.get<{ data: ApiUserDetail }>(`/users/${userId}`, token);
  },

  importCsv(file: File, token: string) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.upload<{ message: string; data: ImportCsvResult }>(
      '/users/import-csv',
      formData,
      token,
    );
  },

  create(payload: CreateUserPayload) {
    return apiClient.post<{ accessToken: string; user: ApiUser }>(
      '/auth/register',
      payload,
    );
  },

  update(userId: string, payload: UpdateUserPayload, token: string) {
    return apiClient.patch<{ message: string; data: ApiUser }>(
      `/users/${userId}`,
      payload,
      token,
    );
  },

  remove(userId: string, token: string) {
    return apiClient.delete<{ message: string }>(`/users/${userId}`, token);
  },
};
