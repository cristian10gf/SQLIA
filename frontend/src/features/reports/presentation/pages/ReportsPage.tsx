import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import { courseApi } from '../../../courses/infrastructure/courseApi';
import type { Course, CourseListResponse } from '../../../courses/domain/course.types';
import { enrollmentApi } from '../../../courses/infrastructure/enrollmentApi';
import type { StudentInCourse, StudentsPageResponse } from '../../../courses/domain/enrollment.types';
import { reportsApi } from '../../infrastructure/reportsApi';
import type { StudentSubmissionSummary } from '../../infrastructure/reportsApi';
import '../styles/ReportsPage.css';

type StudentReportRow = StudentInCourse & {
  summary: StudentSubmissionSummary | null;
};

function normalizeCourseList(response: CourseListResponse): Course[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

function normalizeStudents(response: StudentsPageResponse | unknown): StudentInCourse[] {
  if (!response || typeof response !== 'object') {
    return [];
  }

  const payload = response as StudentsPageResponse;

  return Array.isArray(payload.data) ? payload.data : [];
}

function formatNumber(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return 'N/D';
  }

  return new Intl.NumberFormat('es-CO').format(value);
}

export function ReportsPage() {
  const navigate = useNavigate();

  const [session] = useState(() => ({
    token: authStorage.getToken(),
    user: authStorage.getUser(),
  }));

  const token = session.token;
  const user = session.user;
  const role = user?.role as DashboardRole | undefined;
  const isProfessor = role === 'PROFESSOR';
  const isAdmin = role === 'ADMIN';
  const canViewReports = isProfessor || isAdmin;

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [students, setStudents] = useState<StudentInCourse[]>([]);
  const [studentSummaries, setStudentSummaries] = useState<
    Record<string, StudentSubmissionSummary | null>
  >({});

  const [courseLoading, setCourseLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (!token || !user || !role) {
      navigate('/login', { replace: true });
    }
  }, [navigate, token, user, role]);

  useEffect(() => {
    if (!token || !user || !role) {
      return;
    }

    const authToken = token;
    const currentUser = user;

    let cancelled = false;

    async function loadCourses() {
      try {
        setCourseLoading(true);
        setPageError('');

        const response: CourseListResponse = isProfessor
          ? await courseApi.findByProfessor(currentUser.id, authToken)
          : await courseApi.findAll(authToken);

        const loadedCourses = normalizeCourseList(response);

        if (cancelled) {
          return;
        }

        setCourses(loadedCourses);
        setSelectedCourseId((current) => {
          if (current && loadedCourses.some((course) => course.id === current)) {
            return current;
          }

          return loadedCourses[0]?.id ?? '';
        });
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCourses([]);
        setSelectedCourseId('');
        setPageError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar los cursos para reportes.',
        );
      } finally {
        if (!cancelled) {
          setCourseLoading(false);
        }
      }
    }

    void loadCourses();

    return () => {
      cancelled = true;
    };
  }, [isProfessor, role, token, user?.id]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  useEffect(() => {
    if (!token || !selectedCourse) {
      setStudents([]);
      setStudentSummaries({});
      return;
    }

    const authToken = token;
    const currentCourse = selectedCourse;

    let cancelled = false;

    async function loadCourseDetail() {
      try {
        setDetailLoading(true);
        setPageError('');
        setStudentSearch('');

        const studentsResponse = await enrollmentApi.getStudentsByCourse(
          currentCourse.id,
          authToken,
          1,
          100,
        );

        const loadedStudents = normalizeStudents(studentsResponse);

        if (cancelled) {
          return;
        }

        setStudents(loadedStudents);

        if (!isProfessor) {
          setStudentSummaries({});
          return;
        }

        const summaryEntries = await Promise.all(
          loadedStudents.map(async (studentEntry) => {
            try {
              const response = await reportsApi.getStudentSubmissionSummary(
                currentCourse.id,
                studentEntry.student.id,
                authToken,
              );

              return [studentEntry.student.id, response.data] as const;
            } catch {
              return [studentEntry.student.id, null] as const;
            }
          }),
        );

        if (cancelled) {
          return;
        }

        setStudentSummaries(Object.fromEntries(summaryEntries));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setStudents([]);
        setStudentSummaries({});
        setPageError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar el reporte del curso.',
        );
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    void loadCourseDetail();

    return () => {
      cancelled = true;
    };
  }, [isProfessor, selectedCourse, token]);

  const studentRows = useMemo<StudentReportRow[]>(() => {
    return students.map((studentEntry) => ({
      ...studentEntry,
      summary: studentSummaries[studentEntry.student.id] ?? null,
    }));
  }, [studentSummaries, students]);

  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();

    if (!search) {
      return studentRows;
    }

    return studentRows.filter((row) => {
      return (
        row.student.fullName.toLowerCase().includes(search) ||
        row.student.email.toLowerCase().includes(search) ||
        row.student.id.toLowerCase().includes(search)
      );
    });
  }, [studentRows, studentSearch]);

  const courseMetrics = useMemo(() => {
    const summaries = studentRows
      .map((row) => row.summary)
      .filter((summary): summary is StudentSubmissionSummary => Boolean(summary));

    const totalSubmissions = summaries.reduce((total, summary) => total + summary.total, 0);
    const totalAccepted = summaries.reduce((total, summary) => total + summary.accepted, 0);

    const weightedScore = summaries.reduce((total, summary) => {
      if (summary.avgScore === null) {
        return total;
      }

      return total + summary.avgScore * summary.total;
    }, 0);

    const weightedExecutionTime = summaries.reduce((total, summary) => {
      if (summary.avgExecutionTimeMs === null) {
        return total;
      }

      return total + summary.avgExecutionTimeMs * summary.total;
    }, 0);

    return {
      students: studentRows.length,
      submissions: totalSubmissions,
      accepted: totalAccepted,
      averageScore: totalSubmissions > 0 ? Math.round(weightedScore / totalSubmissions) : null,
      averageExecutionTime:
        totalSubmissions > 0 ? Math.round(weightedExecutionTime / totalSubmissions) : null,
    };
  }, [studentRows]);

  const handleLogout = () => {
    authStorage.clearSession();
    navigate('/login', { replace: true });
  };

  if (!token || !user || !role) {
    return null;
  }

  if (!canViewReports) {
    return (
      <DashboardLayout
        role={role}
        userName={user.fullName}
        onLogout={handleLogout}
      >
        <section className="reports-page">
          <div className="reports-heading">
            <span>Reportes</span>
            <h1>Reportes no disponibles</h1>
            <p>Esta pantalla está reservada para profesores y administradores.</p>
          </div>

          <div className="reports-empty-state">
            No hay reportes para mostrar con el rol actual.
          </div>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role={role}
      userName={user.fullName}
      onLogout={handleLogout}
    >
      <section className="reports-page">
        <div className="reports-heading">
          <span>Reportes</span>
          <h1>Reportes por curso</h1>
          <p>
            Selecciona un curso para consultar las métricas obtenidas desde el
            backend y el resumen de cada estudiante inscrito.
          </p>
        </div>

        {pageError && <div className="reports-empty-state">{pageError}</div>}

        {courseLoading ? (
          <div className="reports-empty-state">Cargando cursos...</div>
        ) : courses.length === 0 || !selectedCourse ? (
          <div className="reports-empty-state">
            No hay cursos disponibles para generar reportes.
          </div>
        ) : (
          <section className="reports-workspace">
            <aside className="reports-list-panel">
              <div className="reports-panel-header">
                <h2>Cursos</h2>
              </div>

              <div className="reports-course-selector-list">
                {courses.map((course) => {
                  const isSelected = selectedCourse.id === course.id;

                  return (
                    <button
                      key={course.id}
                      type="button"
                      className={`reports-course-selector-card ${
                        isSelected ? 'active' : ''
                      }`}
                      onClick={() => setSelectedCourseId(course.id)}
                    >
                      <div className="reports-course-selector-top">
                        <strong>{course.name}</strong>
                      </div>

                      <div className="reports-course-selector-meta">
                        <span>{course.code}</span>
                        <span>{course.group}</span>
                        <span>{course.period}</span>
                        <span>{course.professorId}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <article className="reports-detail-panel">
              <div className="reports-detail-header">
                <div>
                  <span className="reports-course-eyebrow">Reporte del curso</span>
                  <h2>{selectedCourse.name}</h2>
                  <p>
                    {selectedCourse.code} · {selectedCourse.group} · {selectedCourse.period}
                  </p>
                </div>
              </div>

              {isAdmin && (
                <div className="reports-empty-state" style={{ marginBottom: '24px' }}>
                  Como administrador puedes ver cursos y estudiantes inscritos. Las métricas de envíos se consultan directamente en el backend para profesores.
                </div>
              )}

              <section className="reports-metrics-grid reports-course-metrics">
                <article className="reports-metric-card">
                  <span>Estudiantes</span>
                  <strong>{courseMetrics.students}</strong>
                  <p>Estudiantes inscritos en el curso.</p>
                </article>

                <article className="reports-metric-card">
                  <span>Envíos</span>
                  <strong>{formatNumber(courseMetrics.submissions)}</strong>
                  <p>Total de soluciones registradas.</p>
                </article>

                <article className="reports-metric-card">
                  <span>Aceptados</span>
                  <strong>{formatNumber(courseMetrics.accepted)}</strong>
                  <p>Soluciones aceptadas en este curso.</p>
                </article>

                <article className="reports-metric-card">
                  <span>Promedio</span>
                  <strong>{formatNumber(courseMetrics.averageScore)} / 100</strong>
                  <p>Promedio ponderado de calificaciones.</p>
                </article>

                <article className="reports-metric-card">
                  <span>Tiempo promedio</span>
                  <strong>{formatNumber(courseMetrics.averageExecutionTime)} ms</strong>
                  <p>Tiempo medio de ejecución.</p>
                </article>
              </section>

              <section className="reports-section-card">
                <div className="reports-panel-header compact">
                  <h2>Promedio por estudiante</h2>
                  <p>
                    Datos calculados con el endpoint de resumen por estudiante.
                  </p>
                </div>

                <div className="reports-student-search">
                  <input
                    type="search"
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Buscar estudiante por nombre, correo o ID..."
                  />
                </div>

                {detailLoading ? (
                  <div className="reports-empty-state">Cargando estudiantes y resúmenes...</div>
                ) : (
                  <div className="reports-table-wrapper">
                    <table className="reports-table">
                      <thead>
                        <tr>
                          <th>Estudiante</th>
                          <th>Correo</th>
                          <th>Envíos</th>
                          <th>Aceptados</th>
                          <th>Promedio</th>
                          <th>Tiempo promedio</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredStudents.map((student) => (
                          <tr key={student.student.id}>
                            <td>
                              <strong>{student.student.fullName}</strong>
                              <span>{student.student.id}</span>
                            </td>
                            <td>{student.student.email}</td>
                            <td>{formatNumber(student.summary?.total)}</td>
                            <td>{formatNumber(student.summary?.accepted)}</td>
                            <td>
                              <strong>
                                {student.summary?.avgScore === null || student.summary?.avgScore === undefined
                                  ? 'N/D'
                                  : `${formatNumber(student.summary.avgScore)} / 100`}
                              </strong>
                            </td>
                            <td>{formatNumber(student.summary?.avgExecutionTimeMs)} ms</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredStudents.length === 0 && (
                      <div className="reports-empty-state">
                        No se encontraron estudiantes para este curso.
                      </div>
                    )}
                  </div>
                )}
              </section>
            </article>
          </section>
        )}
      </section>
    </DashboardLayout>
  );
}

export default ReportsPage;
