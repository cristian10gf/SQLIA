import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import '../styles/ReportsPage.css';

type SubmissionStatus = 'ACCEPTED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR';

type SubmissionResult = {
  submissionId: string;
  status: SubmissionStatus;
  score: number;
  executionTimeMs: number;
};

type SubmissionItem = {
  id: string;
  studentId: string;
  studentName: string;
  submittedAt: string;
  result: SubmissionResult;
};

type ChallengeReport = {
  id: string;
  title: string;
  difficulty: 'Fácil' | 'Media' | 'Difícil';
  submissions: SubmissionItem[];
};

type EvaluationReport = {
  id: string;
  title: string;
  description: string;
  challenges: ChallengeReport[];
};

type CourseReport = {
  id: string;
  professorId: string;
  professorName: string;
  name: string;
  code: string;
  group: string;
  period: string;
  evaluations: EvaluationReport[];
};

type StudentCourseAverage = {
  studentId: string;
  studentName: string;
  submissions: number;
  accepted: number;
  averageScore: number;
  averageTime: number;
  lastSubmission: string;
};

const mockCourses: CourseReport[] = [
  {
    id: 'course-bd2',
    professorId: 'prof-001',
    professorName: 'Profesor SQL',
    name: 'Bases de Datos II',
    code: 'BD2-2026',
    group: 'Grupo 1',
    period: '2026-1',
    evaluations: [
      {
        id: 'eval-bd2-parcial-1',
        title: 'Parcial 1 - Consultas SQL',
        description: 'Evaluación sobre consultas SELECT, JOIN y filtros.',
        challenges: [
          {
            id: 'challenge-clientes-ciudad',
            title: 'Clientes por ciudad con órdenes recientes',
            difficulty: 'Fácil',
            submissions: [
              {
                id: 'result-1',
                studentId: 'stu-001',
                studentName: 'Laura Gómez',
                submittedAt: '2026-05-18T10:30:00',
                result: {
                  submissionId: 'subm-101',
                  status: 'ACCEPTED',
                  score: 100,
                  executionTimeMs: 120,
                },
              },
              {
                id: 'result-2',
                studentId: 'stu-002',
                studentName: 'Carlos Ruiz',
                submittedAt: '2026-05-18T11:05:00',
                result: {
                  submissionId: 'subm-102',
                  status: 'ACCEPTED',
                  score: 88,
                  executionTimeMs: 145,
                },
              },
              {
                id: 'result-3',
                studentId: 'stu-003',
                studentName: 'María Torres',
                submittedAt: '2026-05-18T11:20:00',
                result: {
                  submissionId: 'subm-103',
                  status: 'WRONG_ANSWER',
                  score: 62,
                  executionTimeMs: 98,
                },
              },
            ],
          },
          {
            id: 'challenge-ordenes-fecha',
            title: 'Órdenes por rango de fechas',
            difficulty: 'Media',
            submissions: [
              {
                id: 'result-4',
                studentId: 'stu-001',
                studentName: 'Laura Gómez',
                submittedAt: '2026-05-18T12:10:00',
                result: {
                  submissionId: 'subm-104',
                  status: 'ACCEPTED',
                  score: 92,
                  executionTimeMs: 170,
                },
              },
              {
                id: 'result-5',
                studentId: 'stu-002',
                studentName: 'Carlos Ruiz',
                submittedAt: '2026-05-18T12:22:00',
                result: {
                  submissionId: 'subm-105',
                  status: 'WRONG_ANSWER',
                  score: 70,
                  executionTimeMs: 210,
                },
              },
            ],
          },
        ],
      },
      {
        id: 'eval-bd2-taller-2',
        title: 'Taller 2 - Agregaciones',
        description: 'Práctica sobre GROUP BY, SUM, COUNT y ordenamientos.',
        challenges: [
          {
            id: 'challenge-total-cliente',
            title: 'Total vendido por cliente',
            difficulty: 'Media',
            submissions: [
              {
                id: 'result-6',
                studentId: 'stu-001',
                studentName: 'Laura Gómez',
                submittedAt: '2026-05-15T15:45:00',
                result: {
                  submissionId: 'subm-106',
                  status: 'ACCEPTED',
                  score: 95,
                  executionTimeMs: 180,
                },
              },
              {
                id: 'result-7',
                studentId: 'stu-003',
                studentName: 'María Torres',
                submittedAt: '2026-05-15T16:03:00',
                result: {
                  submissionId: 'subm-107',
                  status: 'ACCEPTED',
                  score: 82,
                  executionTimeMs: 140,
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'course-bd1',
    professorId: 'prof-001',
    professorName: 'Profesor SQL',
    name: 'Bases de Datos I',
    code: 'BD1-2026',
    group: 'Grupo 2',
    period: '2026-1',
    evaluations: [
      {
        id: 'eval-bd1-quiz-1',
        title: 'Quiz 1 - Filtros básicos',
        description: 'Evaluación corta sobre filtros con WHERE.',
        challenges: [
          {
            id: 'challenge-clientes-medellin',
            title: 'Clientes de Medellín',
            difficulty: 'Fácil',
            submissions: [
              {
                id: 'result-8',
                studentId: 'stu-001',
                studentName: 'Laura Gómez',
                submittedAt: '2026-05-10T09:12:00',
                result: {
                  submissionId: 'subm-108',
                  status: 'WRONG_ANSWER',
                  score: 70,
                  executionTimeMs: 90,
                },
              },
              {
                id: 'result-9',
                studentId: 'stu-004',
                studentName: 'Andrés Pérez',
                submittedAt: '2026-05-10T09:18:00',
                result: {
                  submissionId: 'subm-109',
                  status: 'ACCEPTED',
                  score: 100,
                  executionTimeMs: 85,
                },
              },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'course-sql-avanzado',
    professorId: 'prof-002',
    professorName: 'Profesor Avanzado',
    name: 'SQL Avanzado',
    code: 'SQL-ADV-2026',
    group: 'Grupo 1',
    period: '2026-1',
    evaluations: [
      {
        id: 'eval-sql-avanzado-parcial-2',
        title: 'Parcial 2 - Optimización',
        description: 'Evaluación sobre rendimiento y buenas prácticas SQL.',
        challenges: [
          {
            id: 'challenge-optimizacion-fechas',
            title: 'Optimización de consulta por fechas',
            difficulty: 'Difícil',
            submissions: [
              {
                id: 'result-10',
                studentId: 'stu-001',
                studentName: 'Laura Gómez',
                submittedAt: '2026-05-20T11:25:00',
                result: {
                  submissionId: 'subm-110',
                  status: 'RUNTIME_ERROR',
                  score: 40,
                  executionTimeMs: 2100,
                },
              },
              {
                id: 'result-11',
                studentId: 'stu-005',
                studentName: 'Daniela Castro',
                submittedAt: '2026-05-20T11:40:00',
                result: {
                  submissionId: 'subm-111',
                  status: 'ACCEPTED',
                  score: 90,
                  executionTimeMs: 260,
                },
              },
            ],
          },
        ],
      },
    ],
  },
];

function normalizeRole(role?: string | null) {
  return String(role || '').toUpperCase();
}

function getProfessorIdFromUser(user: any) {
  return String(user?.id || user?.userId || user?.professorId || 'prof-001');
}

function getVisibleCourses(courses: CourseReport[], user: any) {
  const role = normalizeRole(user?.role);

  if (role === 'ADMIN') return courses;

  if (role === 'PROFESSOR' || role === 'PROFESOR') {
    const professorId = getProfessorIdFromUser(user);
    const ownCourses = courses.filter(
      (course) => course.professorId === professorId,
    );

    return ownCourses.length > 0
      ? ownCourses
      : courses.filter((course) => course.professorId === 'prof-001');
  }

  return [];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function getCourseChallenges(course: CourseReport | null) {
  if (!course) return [];

  return course.evaluations.flatMap((evaluation) => evaluation.challenges);
}

function getCourseSubmissions(course: CourseReport | null) {
  if (!course) return [];

  return getCourseChallenges(course).flatMap(
    (challenge) => challenge.submissions,
  );
}

function getCourseAverageTime(course: CourseReport | null) {
  const submissions = getCourseSubmissions(course);

  if (submissions.length === 0) return 0;

  const total = submissions.reduce(
    (acc, submission) => acc + submission.result.executionTimeMs,
    0,
  );

  return Math.round(total / submissions.length);
}

function getCourseAverageScore(course: CourseReport | null) {
  const submissions = getCourseSubmissions(course);

  if (submissions.length === 0) return 0;

  const total = submissions.reduce(
    (acc, submission) => acc + submission.result.score,
    0,
  );

  return Math.round(total / submissions.length);
}

function getCourseAcceptedCount(course: CourseReport | null) {
  return getCourseSubmissions(course).filter(
    (submission) => submission.result.status === 'ACCEPTED',
  ).length;
}

function getCourseStudentAverages(course: CourseReport | null) {
  const submissions = getCourseSubmissions(course);
  const grouped = new Map<string, SubmissionItem[]>();

  submissions.forEach((submission) => {
    const current = grouped.get(submission.studentId) || [];
    grouped.set(submission.studentId, [...current, submission]);
  });

  const averages: StudentCourseAverage[] = Array.from(grouped.entries()).map(
    ([studentId, items]) => {
      const scoreTotal = items.reduce(
        (acc, submission) => acc + submission.result.score,
        0,
      );

      const timeTotal = items.reduce(
        (acc, submission) => acc + submission.result.executionTimeMs,
        0,
      );

      const accepted = items.filter(
        (submission) => submission.result.status === 'ACCEPTED',
      ).length;

      const lastSubmission = [...items].sort(
        (a, b) =>
          new Date(b.submittedAt).getTime() -
          new Date(a.submittedAt).getTime(),
      )[0];

      return {
        studentId,
        studentName: items[0].studentName,
        submissions: items.length,
        accepted,
        averageScore: Math.round(scoreTotal / items.length),
        averageTime: Math.round(timeTotal / items.length),
        lastSubmission: lastSubmission.submittedAt,
      };
    },
  );

  return averages.sort((a, b) => b.averageScore - a.averageScore);
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
  const normalizedRole = normalizeRole(role);

  const canViewReports =
    normalizedRole === 'PROFESSOR' ||
    normalizedRole === 'PROFESOR' ||
    normalizedRole === 'ADMIN';

  const visibleCourses = useMemo(() => {
    return getVisibleCourses(mockCourses, user);
  }, [user]);

  const firstCourse = visibleCourses[0] || null;
  const [selectedCourseId, setSelectedCourseId] = useState(
    firstCourse?.id || '',
  );

  const [studentSearch, setStudentSearch] = useState('');

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true });
    }
  }, [navigate, token, user]);

  useEffect(() => {
    if (!firstCourse) return;

    const courseStillVisible = visibleCourses.some(
      (course) => course.id === selectedCourseId,
    );

    if (!courseStillVisible) {
      setSelectedCourseId(firstCourse.id);
      setStudentSearch('');
    }
  }, [firstCourse, selectedCourseId, visibleCourses]);

  const selectedCourse = useMemo(() => {
    return (
      visibleCourses.find((course) => course.id === selectedCourseId) ||
      visibleCourses[0] ||
      null
    );
  }, [visibleCourses, selectedCourseId]);

  const courseChallenges = getCourseChallenges(selectedCourse);
  const courseSubmissions = getCourseSubmissions(selectedCourse);
  const courseAcceptedCount = getCourseAcceptedCount(selectedCourse);
  const courseAverageTime = getCourseAverageTime(selectedCourse);
  const courseAverageScore = getCourseAverageScore(selectedCourse);
  const courseStudents = getCourseStudentAverages(selectedCourse);

  const filteredStudents = useMemo(() => {
    const search = studentSearch.trim().toLowerCase();

    if (!search) return courseStudents;

    return courseStudents.filter((student) => {
      return (
        student.studentName.toLowerCase().includes(search) ||
        student.studentId.toLowerCase().includes(search)
      );
    });
  }, [courseStudents, studentSearch]);

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
            <p>
              Esta pantalla está reservada para profesores y administradores.
            </p>
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
            Selecciona un curso para consultar sus métricas generales y el
            promedio de los estudiantes según los resultados obtenidos.
          </p>
        </div>

        {visibleCourses.length === 0 || !selectedCourse ? (
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
                {visibleCourses.map((course) => {
                  const submissions = getCourseSubmissions(course);
                  const challenges = getCourseChallenges(course);
                  const averageScore = getCourseAverageScore(course);

                  return (
                    <button
                      key={course.id}
                      type="button"
                      className={`reports-course-selector-card ${
                        selectedCourse.id === course.id ? 'active' : ''
                      }`}
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setStudentSearch('');
                      }}
                    >
                      <div className="reports-course-selector-top">
                        <strong>{course.name}</strong>
                      </div>

                      <div className="reports-course-selector-meta">
                        <span>{course.code}</span>
                        <span>{course.group}</span>
                        <span>{course.period}</span>
                        {normalizedRole === 'ADMIN' && (
                          <span>{course.professorName}</span>
                        )}
                        <span>{course.evaluations.length} evaluaciones</span>
                        <span>{challenges.length} retos</span>
                        <span>{submissions.length} envíos</span>
                        <span>Promedio {averageScore}/100</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </aside>

            <article className="reports-detail-panel">
              <div className="reports-detail-header">
                <div>
                  <span className="reports-course-eyebrow">
                    Reporte del curso
                  </span>

                  <h2>{selectedCourse.name}</h2>

                  <p>
                    {selectedCourse.code} · {selectedCourse.group} ·{' '}
                    {selectedCourse.period}
                    {normalizedRole === 'ADMIN'
                      ? ` · Profesor: ${selectedCourse.professorName}`
                      : ''}
                  </p>
                </div>
              </div>

              <section className="reports-metrics-grid reports-course-metrics">
                <article className="reports-metric-card">
                  <span>Evaluaciones</span>
                  <strong>{selectedCourse.evaluations.length}</strong>
                  <p>Evaluaciones creadas en este curso.</p>
                </article>

                <article className="reports-metric-card">
                  <span>Retos</span>
                  <strong>{courseChallenges.length}</strong>
                  <p>Retos asociados a las evaluaciones.</p>
                </article>

                <article className="reports-metric-card">
                  <span>Envíos</span>
                  <strong>{courseSubmissions.length}</strong>
                  <p>Total de soluciones enviadas.</p>
                </article>

                <article className="reports-metric-card">
                  <span>Aceptados</span>
                  <strong>{courseAcceptedCount}</strong>
                  <p>Soluciones aceptadas en este curso.</p>
                </article>

                <article className="reports-metric-card">
                  <span>Promedio curso</span>
                  <strong>{courseAverageScore}/100</strong>
                  <p>Promedio de calificaciones del curso.</p>
                </article>

                <article className="reports-metric-card">
                  <span>Tiempo promedio</span>
                  <strong>{courseAverageTime} ms</strong>
                  <p>Tiempo medio de ejecución.</p>
                </article>
              </section>

              <section className="reports-section-card">
                <div className="reports-panel-header compact">
                  <h2>Promedio por estudiante</h2>
                </div>

                <div className="reports-student-search">
                  <input
                    type="search"
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Buscar estudiante por nombre o código..."
                  />
                </div>

                <div className="reports-table-wrapper">
                  <table className="reports-table">
                    <thead>
                      <tr>
                        <th>Estudiante</th>
                        <th>Envíos</th>
                        <th>Aceptados</th>
                        <th>Promedio</th>
                        <th>Tiempo promedio</th>
                        <th>Último envío</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.studentId}>
                          <td>
                            <strong>{student.studentName}</strong>
                            <span>{student.studentId}</span>
                          </td>
                          <td>{student.submissions}</td>
                          <td>{student.accepted}</td>
                          <td>
                            <strong>{student.averageScore}/100</strong>
                          </td>
                          <td>{student.averageTime} ms</td>
                          <td>{formatDate(student.lastSubmission)}</td>
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
              </section>
            </article>
          </section>
        )}
      </section>
    </DashboardLayout>
  );
}

export default ReportsPage;