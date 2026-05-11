import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { courseApi } from '../../../courses/infrastructure/courseApi';
import type { Course, CourseListResponse } from '../../../courses/domain/course.types';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import { AdminDashboard } from '../components/AdminDashboard';
import { ProfessorDashboard } from '../components/ProfessorDashboard';
import { StudentDashboard } from '../components/StudentDashboard';
import '../styles/DashboardPage.css';

function normalizeCourseList(response: CourseListResponse): Course[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

export function DashboardPage() {
  const navigate = useNavigate();

  const [session] = useState(() => ({
    token: authStorage.getToken(),
    user: authStorage.getUser(),
  }));

  const token = session.token;
  const user = session.user;
  const role = user?.role as DashboardRole | undefined;

  const [courseCount, setCourseCount] = useState(0);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [dashboardError, setDashboardError] = useState('');

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true });
    }
  }, [navigate, token, user]);

  const loadDashboardData = useCallback(async () => {
    if (!token || !user || !role) {
      return;
    }

    try {
      setIsLoadingCourses(true);
      setDashboardError('');

      let response: CourseListResponse;

      if (role === 'ADMIN') {
        response = await courseApi.findAll(token);
        setCourseCount(normalizeCourseList(response).length);
        return;
      }

      if (role === 'PROFESSOR') {
        response = await courseApi.findAll(token);

        const professorCourses = normalizeCourseList(response).filter(
          (course) => course.professorId === user.id,
        );

        setCourseCount(professorCourses.length);
        return;
      }

      response = await courseApi.findByStudent(user.id, token);
      setCourseCount(normalizeCourseList(response).length);
    } catch (error) {
      setDashboardError(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar la información del dashboard.',
      );
    } finally {
      setIsLoadingCourses(false);
    }
  }, [role, token, user?.id]);

  useEffect(() => {
    void loadDashboardData();
  }, [loadDashboardData]);

  const handleLogout = () => {
    authStorage.clearSession();
    navigate('/login', { replace: true });
  };

  if (!token || !user || !role) {
    return null;
  }

  const renderDashboardByRole = () => {
    if (role === 'ADMIN') {
      return (
        <AdminDashboard
          courseCount={courseCount}
          isLoading={isLoadingCourses}
          error={dashboardError}
        />
      );
    }

    if (role === 'PROFESSOR') {
      return (
        <ProfessorDashboard
          courseCount={courseCount}
          isLoading={isLoadingCourses}
          error={dashboardError}
        />
      );
    }

    return (
      <StudentDashboard
        courseCount={courseCount}
        isLoading={isLoadingCourses}
        error={dashboardError}
      />
    );
  };

  return (
    <DashboardLayout
      role={role}
      userName={user.fullName}
      onLogout={handleLogout}
    >
      {renderDashboardByRole()}
    </DashboardLayout>
  );
}