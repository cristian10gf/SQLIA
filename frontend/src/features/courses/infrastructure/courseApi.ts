import { apiClient } from '../../../shared/infrastructure/http/apiClient';
import type {
  Course,
  CourseListResponse,
  CourseMutationResponse,
  CoursePayload,
} from '../domain/course.types';

export const courseApi = {
  findAll(token: string) {
    return apiClient.get<CourseListResponse>('/courses?page=1&limit=50', token);
  },

  findByStudent(studentId: string, token: string) {
    return apiClient.get<CourseListResponse>(
      `/enrollments/student/${studentId}/courses`,
      token,
    );
  },

  findByProfessor(professorId: string, token: string) {
    return apiClient.get<CourseListResponse>(
      `/enrollments/professor/${professorId}/courses`,
      token,
    );
  },

  create(payload: CoursePayload, token: string) {
    return apiClient.post<CourseMutationResponse>('/courses', payload, token);
  },

  update(courseId: string, payload: CoursePayload, token: string) {
    return apiClient.patch<CourseMutationResponse>(
      `/courses/${courseId}`,
      payload,
      token,
    );
  },

  remove(courseId: string, token: string) {
    return apiClient.delete<CourseMutationResponse>(`/courses/${courseId}`, token);
  },

  findById(courseId: string, token: string) {
    return apiClient.get<Course>(`/courses/${courseId}`, token);
  },
};