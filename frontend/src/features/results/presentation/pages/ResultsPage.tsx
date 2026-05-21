import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import '../styles/ResultsPage.css';

type SubmissionStatus = 'ACCEPTED' | 'WRONG_ANSWER' | 'RUNTIME_ERROR';

type TestCaseResult = {
  caseId: number;
  status: 'OK' | 'FAILED';
  rowsExpected: number;
  rowsReturned: number;
};

type SubmissionResult = {
  submissionId: string;
  status: SubmissionStatus;
  score: number;
  executionTimeMs: number;
  tests: TestCaseResult[];
};

type SubmissionItem = {
  id: string;
  studentName: string;
  challengeName: string;
  submittedAt: string;
  submittedQuery: string;
  result: SubmissionResult;
  assistantFeedback: string;
};

type EvaluationResult = {
  id: string;
  title: string;
  description: string;
  submissions: SubmissionItem[];
};

type CourseResult = {
  id: string;
  name: string;
  code: string;
  group: string;
  period: string;
  evaluations: EvaluationResult[];
};

const mockCourses: CourseResult[] = [
  {
    id: 'course-bd2',
    name: 'Bases de Datos II',
    code: 'BD2-2026',
    group: 'Grupo 1',
    period: '2026-1',
    evaluations: [
      {
        id: 'eval-bd2-parcial-1',
        title: 'Parcial 1 - Consultas SQL',
        description: 'Evaluación sobre consultas SELECT, JOIN y filtros.',
        submissions: [
          {
            id: 'result-1',
            studentName: 'Laura Gómez',
            challengeName: 'Clientes por ciudad con órdenes recientes',
            submittedAt: '2026-05-18T10:30:00',
            submittedQuery: `SELECT *
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.city = 'Bogotá'
ORDER BY o.created_at DESC;`,
            result: {
              submissionId: 'subm-101',
              status: 'ACCEPTED',
              score: 100,
              executionTimeMs: 120,
              tests: [
                {
                  caseId: 1,
                  status: 'OK',
                  rowsExpected: 5,
                  rowsReturned: 5,
                },
                {
                  caseId: 2,
                  status: 'OK',
                  rowsExpected: 8,
                  rowsReturned: 8,
                },
              ],
            },
            assistantFeedback: `La consulta puede funcionar, pero tiene oportunidades de mejora.

Recomendaciones:
1. Evita usar SELECT * si no necesitas todas las columnas.
2. Selecciona únicamente los campos requeridos para reducir transferencia de datos.
3. Mantén alias claros para mejorar la lectura de la consulta.

Sugerencia de índices:
1. Se recomienda revisar un índice sobre customers.city, porque esa columna se usa como filtro.
2. También puede ser útil un índice sobre orders.customer_id para mejorar el JOIN.
3. Un índice sobre orders.created_at puede ayudar si el ordenamiento se usa con frecuencia.

Advertencias:
1. SELECT * puede afectar rendimiento cuando las tablas crecen.
2. Ordenar grandes volúmenes de datos sin índice puede incrementar el tiempo de ejecución.

Propuesta de reescritura:
SELECT
  c.name,
  c.city,
  o.total,
  o.created_at
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.city = 'Bogotá'
ORDER BY o.created_at DESC;

Impacto de la mejora:
La reescritura reduce columnas innecesarias, mejora la legibilidad y puede disminuir el costo de lectura cuando existan más registros.`,
          },
          {
            id: 'result-5',
            studentName: 'Carlos Ruiz',
            challengeName: 'Clientes por ciudad con órdenes recientes',
            submittedAt: '2026-05-18T11:05:00',
            submittedQuery: `SELECT c.name, c.city, o.total
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE c.city = 'Bogotá';`,
            result: {
              submissionId: 'subm-105',
              status: 'ACCEPTED',
              score: 88,
              executionTimeMs: 145,
              tests: [
                {
                  caseId: 1,
                  status: 'OK',
                  rowsExpected: 5,
                  rowsReturned: 5,
                },
              ],
            },
            assistantFeedback: `La consulta cumple el objetivo principal y evita SELECT *.

Recomendaciones:
1. Mantén alias consistentes.
2. Agrega ORDER BY si el enunciado exige un orden específico.
3. Revisa índices sobre city y customer_id si el volumen de datos crece.`,
          },
        ],
      },
      {
        id: 'eval-bd2-taller-2',
        title: 'Taller 2 - Agregaciones',
        description: 'Práctica sobre GROUP BY, SUM, COUNT y ordenamientos.',
        submissions: [
          {
            id: 'result-2',
            studentName: 'Laura Gómez',
            challengeName: 'Total vendido por cliente',
            submittedAt: '2026-05-15T15:45:00',
            submittedQuery: `SELECT c.name, SUM(o.total) AS total_orders
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.name
ORDER BY total_orders DESC;`,
            result: {
              submissionId: 'subm-102',
              status: 'ACCEPTED',
              score: 95,
              executionTimeMs: 180,
              tests: [
                {
                  caseId: 1,
                  status: 'OK',
                  rowsExpected: 3,
                  rowsReturned: 3,
                },
                {
                  caseId: 2,
                  status: 'OK',
                  rowsExpected: 4,
                  rowsReturned: 4,
                },
              ],
            },
            assistantFeedback: `La solución resuelve el reto y aplica correctamente SUM con GROUP BY. Puede mejorar agrupando por una clave estable.

Recomendaciones:
1. Agrupa por el identificador del cliente además del nombre.
2. Usa un alias semántico como total_vendido para mayor claridad.

Sugerencia de índices:
1. Un índice sobre orders.customer_id puede mejorar el JOIN y la agregación.

Advertencias:
1. Agrupar solo por nombre puede mezclar clientes diferentes que tengan el mismo nombre.

Propuesta de reescritura:
SELECT
  c.id,
  c.name,
  SUM(o.total) AS total_vendido
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.id, c.name
ORDER BY total_vendido DESC;

Impacto de la mejora:
La mejora evita ambigüedades cuando existan clientes con nombres repetidos y mantiene el resultado más confiable.`,
          },
        ],
      },
    ],
  },
  {
    id: 'course-bd1',
    name: 'Bases de Datos I',
    code: 'BD1-2026',
    group: 'Grupo 2',
    period: '2026-1',
    evaluations: [
      {
        id: 'eval-bd1-quiz-1',
        title: 'Quiz 1 - Filtros básicos',
        description: 'Evaluación corta sobre filtros con WHERE.',
        submissions: [
          {
            id: 'result-3',
            studentName: 'Laura Gómez',
            challengeName: 'Clientes de Medellín',
            submittedAt: '2026-05-10T09:12:00',
            submittedQuery: `SELECT name
FROM customers
WHERE city = 'Medellín';`,
            result: {
              submissionId: 'subm-103',
              status: 'WRONG_ANSWER',
              score: 70,
              executionTimeMs: 90,
              tests: [
                {
                  caseId: 1,
                  status: 'OK',
                  rowsExpected: 2,
                  rowsReturned: 2,
                },
                {
                  caseId: 2,
                  status: 'FAILED',
                  rowsExpected: 3,
                  rowsReturned: 2,
                },
              ],
            },
            assistantFeedback: `La consulta está bien estructurada, pero no retorna todas las columnas esperadas por el caso de prueba.

Recomendaciones:
1. Revisa el enunciado para confirmar qué columnas deben aparecer en el resultado.
2. Incluye el identificador del cliente si el reto lo solicita.

Sugerencia de índices:
1. Un índice sobre customers.city puede acelerar el filtro por ciudad.

Advertencias:
1. La respuesta puede fallar aunque la consulta sea válida si no coincide exactamente con el formato esperado.

Propuesta de reescritura:
SELECT id, name, city
FROM customers
WHERE city = 'Medellín';

Impacto de la mejora:
La consulta sugerida se ajusta mejor a pruebas que esperan identificar cada registro con su ciudad.`,
          },
        ],
      },
    ],
  },
  {
    id: 'course-sql-avanzado',
    name: 'SQL Avanzado',
    code: 'SQL-ADV-2026',
    group: 'Grupo 1',
    period: '2026-1',
    evaluations: [
      {
        id: 'eval-sql-avanzado-parcial-2',
        title: 'Parcial 2 - Optimización',
        description: 'Evaluación sobre rendimiento y buenas prácticas SQL.',
        submissions: [
          {
            id: 'result-4',
            studentName: 'Laura Gómez',
            challengeName: 'Órdenes por rango de fechas',
            submittedAt: '2026-05-20T11:25:00',
            submittedQuery: `SELECT *
FROM orders
WHERE created_at BETWEEN '2026-01-01' AND '2026-03-31'
ORDER BY created_at DESC;`,
            result: {
              submissionId: 'subm-104',
              status: 'RUNTIME_ERROR',
              score: 40,
              executionTimeMs: 2100,
              tests: [
                {
                  caseId: 1,
                  status: 'FAILED',
                  rowsExpected: 10,
                  rowsReturned: 0,
                },
              ],
            },
            assistantFeedback: `La consulta presenta problemas durante la ejecución y debe revisarse antes de considerarse correcta.

Recomendaciones:
1. Verifica que la tabla orders exista en el esquema del reto.
2. Revisa que la columna created_at exista y tenga tipo DATE o TIMESTAMP.
3. Evita SELECT * si el enunciado pide columnas específicas.

Sugerencia de índices:
1. Si el filtro por fecha es frecuente, puede ser útil un índice sobre orders.created_at.

Advertencias:
1. Cuando el volumen de órdenes es alto, ordenar por fecha sin índice puede ser costoso.
2. El error de ejecución puede impedir que el sistema compare correctamente el resultado esperado.

Propuesta de reescritura:
SELECT
  id,
  customer_id,
  total,
  created_at
FROM orders
WHERE created_at BETWEEN '2026-01-01' AND '2026-03-31'
ORDER BY created_at DESC;

Impacto de la mejora:
La consulta sugerida es más explícita, facilita la revisión del resultado y puede mejorar el rendimiento si se acompaña de un índice adecuado.`,
          },
        ],
      },
    ],
  },
];

function getStatusLabel(status: SubmissionStatus) {
  if (status === 'ACCEPTED') return 'Aceptado';
  if (status === 'WRONG_ANSWER') return 'Incorrecto';
  return 'Con error';
}

function getStatusClass(status: SubmissionStatus) {
  if (status === 'ACCEPTED') return 'accepted';
  if (status === 'WRONG_ANSWER') return 'wrong';
  return 'error';
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

function formatJson(result: SubmissionResult) {
  return JSON.stringify(
    {
      submissionId: result.submissionId,
      status: result.status,
      score: result.score,
      executionTimeMs: result.executionTimeMs,
    },
    null,
    2,
  );
}

function getCourseSubmissions(course: CourseResult | null) {
  if (!course) return [];

  return course.evaluations.flatMap((evaluation) => evaluation.submissions);
}

function getCourseAcceptedCount(course: CourseResult | null) {
  return getCourseSubmissions(course).filter(
    (submission) => submission.result.status === 'ACCEPTED',
  ).length;
}

function getCourseAverageTime(course: CourseResult | null) {
  const submissions = getCourseSubmissions(course);

  if (submissions.length === 0) return 0;

  const total = submissions.reduce(
    (acc, submission) => acc + submission.result.executionTimeMs,
    0,
  );

  return Math.round(total / submissions.length);
}

function getEvaluationAcceptedCount(evaluation: EvaluationResult | null) {
  if (!evaluation) return 0;

  return evaluation.submissions.filter(
    (submission) => submission.result.status === 'ACCEPTED',
  ).length;
}

function getTotalEvaluations(courses: CourseResult[]) {
  return courses.reduce((total, course) => total + course.evaluations.length, 0);
}

function getAllSubmissions(courses: CourseResult[]) {
  return courses.flatMap((course) =>
    course.evaluations.flatMap((evaluation) => evaluation.submissions),
  );
}

function getGlobalAverageTime(courses: CourseResult[]) {
  const submissions = getAllSubmissions(courses);

  if (submissions.length === 0) return 0;

  const total = submissions.reduce(
    (acc, submission) => acc + submission.result.executionTimeMs,
    0,
  );

  return Math.round(total / submissions.length);
}

export function ResultsPage() {
  const navigate = useNavigate();

  const [session] = useState(() => ({
    token: authStorage.getToken(),
    user: authStorage.getUser(),
  }));

  const token = session.token;
  const user = session.user;
  const role = user?.role as DashboardRole | undefined;

  const firstCourse = mockCourses[0];
  const firstEvaluation = firstCourse.evaluations[0];
  const firstSubmission = firstEvaluation.submissions[0];

  const [selectedCourseId, setSelectedCourseId] = useState(firstCourse.id);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState(
    firstEvaluation.id,
  );
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(
    firstSubmission.id,
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SubmissionStatus | 'ALL'>(
    'ALL',
  );

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true });
    }
  }, [navigate, token, user]);

  const isProfessorView = role === 'PROFESSOR' || role === 'ADMIN';

  const selectedCourse = useMemo(() => {
    return (
      mockCourses.find((course) => course.id === selectedCourseId) ||
      mockCourses[0]
    );
  }, [selectedCourseId]);

  const selectedEvaluation = useMemo(() => {
    return (
      selectedCourse.evaluations.find(
        (evaluation) => evaluation.id === selectedEvaluationId,
      ) || selectedCourse.evaluations[0]
    );
  }, [selectedCourse, selectedEvaluationId]);

  const filteredSubmissions = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return selectedEvaluation.submissions.filter((submission) => {
      const matchesStatus =
        statusFilter === 'ALL' || submission.result.status === statusFilter;

      const submissionId = submission.result.submissionId.toLowerCase();
      const matchesSearch = !search || submissionId.includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [selectedEvaluation, searchTerm, statusFilter]);

  const selectedSubmission = useMemo(() => {
    return (
      filteredSubmissions.find(
        (submission) => submission.id === selectedSubmissionId,
      ) ||
      filteredSubmissions[0] ||
      null
    );
  }, [filteredSubmissions, selectedSubmissionId]);

  const courseSubmissions = getCourseSubmissions(selectedCourse);
  const courseAcceptedCount = getCourseAcceptedCount(selectedCourse);
  const courseAverageTime = getCourseAverageTime(selectedCourse);
  const allSubmissions = getAllSubmissions(mockCourses);
  const globalAverageTime = getGlobalAverageTime(mockCourses);

  const handleSelectCourse = (courseId: string) => {
    const course = mockCourses.find((item) => item.id === courseId);

    if (!course) return;

    const evaluation = course.evaluations[0];
    const submission = evaluation?.submissions[0];

    setSelectedCourseId(course.id);
    setSelectedEvaluationId(evaluation?.id || '');
    setSelectedSubmissionId(submission?.id || '');
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  const handleSelectEvaluation = (evaluationId: string) => {
    const evaluation = selectedCourse.evaluations.find(
      (item) => item.id === evaluationId,
    );

    if (!evaluation) return;

    const submission = evaluation.submissions[0];

    setSelectedEvaluationId(evaluation.id);
    setSelectedSubmissionId(submission?.id || '');
    setSearchTerm('');
    setStatusFilter('ALL');
  };

  const handleLogout = () => {
    authStorage.clearSession();
    navigate('/login', { replace: true });
  };

  if (!token || !user || !role) {
    return null;
  }

  return (
    <DashboardLayout
      role={role}
      userName={user.fullName}
      onLogout={handleLogout}
    >
      <section className="results-page">
        <div className="results-heading">
          <span>{isProfessorView ? 'Reportes' : 'Mis resultados'}</span>

          <h1>
            {isProfessorView
              ? 'Reportes de cursos y evaluaciones'
              : 'Resultados y recomendaciones'}
          </h1>

          <p>
            {isProfessorView
              ? 'Consulta los cursos, sus evaluaciones y los submissions enviados por los estudiantes.'
              : 'Selecciona un curso, luego una evaluación y revisa tus submissions enviados en cada reto SQL.'}
          </p>
        </div>

        {isProfessorView ? (
          <section className="results-metrics-grid">
            <article className="results-metric-card">
              <span>Cursos</span>
              <strong>{mockCourses.length}</strong>
              <p>Cursos asignados al profesor.</p>
            </article>

            <article className="results-metric-card">
              <span>Evaluaciones</span>
              <strong>{getTotalEvaluations(mockCourses)}</strong>
              <p>Evaluaciones creadas en los cursos.</p>
            </article>

            <article className="results-metric-card">
              <span>Submissions</span>
              <strong>{allSubmissions.length}</strong>
              <p>Total de envíos registrados.</p>
            </article>

            <article className="results-metric-card">
              <span>Tiempo promedio</span>
              <strong>{globalAverageTime} ms</strong>
              <p>Tiempo medio general de ejecución.</p>
            </article>
          </section>
        ) : (
          <section className="results-metrics-grid student-metrics-grid">
            <article className="results-metric-card">
              <span>Evaluaciones</span>
              <strong>{selectedCourse.evaluations.length}</strong>
              <p>Evaluaciones disponibles en el curso.</p>
            </article>

            <article className="results-metric-card">
              <span>Submissions</span>
              <strong>{courseSubmissions.length}</strong>
              <p>Envíos registrados en este curso.</p>
            </article>

            <article className="results-metric-card">
              <span>Aceptados</span>
              <strong>{courseAcceptedCount}</strong>
              <p>Soluciones aceptadas en el curso.</p>
            </article>
          </section>
        )}

        <section className="results-workspace">
          <aside className="results-list-panel">
            <div className="results-panel-header">
              <h2>Cursos</h2>
              <p>
                {isProfessorView
                  ? 'Selecciona un curso para revisar su reporte.'
                  : 'Selecciona el curso donde quieres revisar resultados.'}
              </p>
            </div>

            <div className="course-selector-list">
              {mockCourses.map((course) => {
                const submissions = getCourseSubmissions(course);
                const acceptedCount = getCourseAcceptedCount(course);
                const averageTime = getCourseAverageTime(course);

                return (
                  <button
                    key={course.id}
                    type="button"
                    className={`course-selector-card ${
                      selectedCourse.id === course.id ? 'active' : ''
                    }`}
                    onClick={() => handleSelectCourse(course.id)}
                  >
                    <div className="course-selector-top">
                      <strong>{course.name}</strong>
                    </div>

                    <div className="course-selector-meta">
                      <span>{course.code}</span>
                      <span>{course.group}</span>
                      <span>{course.period}</span>
                      <span>{course.evaluations.length} evaluaciones</span>
                      <span>{submissions.length} submissions</span>
                      <span>{acceptedCount} aceptados</span>
                      {isProfessorView && <span>{averageTime} ms promedio</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <article className="results-detail-panel">
            <div className="results-detail-header">
              <div>
                <span className="results-course-eyebrow">
                  {isProfessorView ? 'Reporte del curso' : 'Curso seleccionado'}
                </span>

                <h2>{selectedCourse.name}</h2>

                <p>
                  {selectedCourse.code} · {selectedCourse.group} ·{' '}
                  {selectedCourse.period}
                </p>
              </div>
            </div>

            <section className="evaluations-section">
              <div className="results-panel-header compact">
                <h2>Evaluaciones</h2>
                <p>Una evaluación puede contener uno o varios retos SQL.</p>
              </div>

              <div className="evaluation-selector-list">
                {selectedCourse.evaluations.map((evaluation) => {
                  const accepted = getEvaluationAcceptedCount(evaluation);

                  return (
                    <button
                      key={evaluation.id}
                      type="button"
                      className={`evaluation-selector-card ${
                        selectedEvaluation.id === evaluation.id ? 'active' : ''
                      }`}
                      onClick={() => handleSelectEvaluation(evaluation.id)}
                    >
                      <div>
                        <strong>{evaluation.title}</strong>
                        <p>{evaluation.description}</p>
                      </div>

                      <div className="evaluation-selector-meta">
                        <span>{evaluation.submissions.length} submissions</span>
                        <span>{accepted} aceptados</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="submissions-section">
              <div className="results-panel-header compact">
                <h2>
                  {isProfessorView
                    ? 'Submissions de estudiantes'
                    : 'Submissions de la evaluación'}
                </h2>

                <p>La búsqueda se realiza únicamente por ID del submission.</p>
              </div>

              <div className="results-filters horizontal">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por submission..."
                />

                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as SubmissionStatus | 'ALL',
                    )
                  }
                >
                  <option value="ALL">Todos</option>
                  <option value="ACCEPTED">Aceptados</option>
                  <option value="WRONG_ANSWER">Incorrectos</option>
                  <option value="RUNTIME_ERROR">Con error</option>
                </select>
              </div>

              <div className="course-submissions-list">
                {filteredSubmissions.map((submission) => (
                  <button
                    key={submission.id}
                    type="button"
                    className={`course-submission-card ${
                      selectedSubmission?.id === submission.id ? 'active' : ''
                    }`}
                    onClick={() => setSelectedSubmissionId(submission.id)}
                  >
                    <div className="course-submission-main">
                      <div>
                        <strong>{submission.challengeName}</strong>

                        <p>
                          {isProfessorView
                            ? `${submission.studentName} · ${selectedEvaluation.title}`
                            : selectedEvaluation.title}
                        </p>
                      </div>

                      <span
                        className={`result-status ${getStatusClass(
                          submission.result.status,
                        )}`}
                      >
                        {getStatusLabel(submission.result.status)}
                      </span>
                    </div>

                    <div className="result-item-meta">
                      <span>{submission.result.submissionId}</span>
                      <span>{submission.result.score}/100 pts</span>
                      <span>{submission.result.executionTimeMs} ms</span>
                    </div>
                  </button>
                ))}

                {filteredSubmissions.length === 0 && (
                  <div className="results-empty-state">
                    No se encontraron submissions con los filtros actuales.
                  </div>
                )}
              </div>
            </section>

            {selectedSubmission && (
              <div className="submission-detail-section">
                <div className="results-detail-grid">
                  {isProfessorView && (
                    <div>
                      <span>Estudiante</span>
                      <strong>{selectedSubmission.studentName}</strong>
                    </div>
                  )}

                  <div>
                    <span>Puntaje</span>
                    <strong>{selectedSubmission.result.score}/100</strong>
                  </div>

                  <div>
                    <span>Tiempo de ejecución</span>
                    <strong>
                      {selectedSubmission.result.executionTimeMs} ms
                    </strong>
                  </div>

                  <div>
                    <span>Fecha de envío</span>
                    <strong>{formatDate(selectedSubmission.submittedAt)}</strong>
                  </div>
                </div>

                <div className="results-score-card">
                  <div>
                    <span>Progreso del puntaje</span>
                    <strong>{selectedSubmission.result.score}%</strong>
                  </div>

                  <div className="results-score-track">
                    <div
                      className="results-score-fill"
                      style={{ width: `${selectedSubmission.result.score}%` }}
                    />
                  </div>
                </div>

                <section className="results-section-card">
                  <h3>Consulta enviada</h3>

                  <pre className="results-code-block">
{selectedSubmission.submittedQuery}
                  </pre>
                </section>

                <section className="results-section-card">
                  <h3>Resultado de ejecución</h3>

                  <pre className="results-json-block">
{formatJson(selectedSubmission.result)}
                  </pre>
                </section>

                <section className="results-section-card assistant-card">
                  <h3>Retroalimentación del asistente IA</h3>

                  <div className="assistant-single-text">
                    {selectedSubmission.assistantFeedback}
                  </div>
                </section>
              </div>
            )}
          </article>
        </section>
      </section>
    </DashboardLayout>
  );
}