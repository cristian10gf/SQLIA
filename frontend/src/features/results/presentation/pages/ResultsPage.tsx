import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import '../styles/ResultsPage.css';

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
  submittedQuery: string;
  result: SubmissionResult;
  assistantFeedback: string;
};

type ChallengeResult = {
  id: string;
  title: string;
  description: string;
  difficulty: 'Fácil' | 'Media' | 'Difícil';
  submissions: SubmissionItem[];
};

type EvaluationResult = {
  id: string;
  title: string;
  description: string;
  challenges: ChallengeResult[];
};

type CourseResult = {
  id: string;
  professorId: string;
  professorName: string;
  name: string;
  code: string;
  group: string;
  period: string;
  evaluations: EvaluationResult[];
};

const mockCourses: CourseResult[] = [
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
            description:
              'Consultar los clientes de una ciudad junto con sus órdenes recientes.',
            difficulty: 'Fácil',
            submissions: [
              {
                id: 'result-1',
                studentId: 'stu-001',
                studentName: 'Laura Gómez',
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
                },
                assistantFeedback: `La consulta puede funcionar, pero tiene oportunidades de mejora.

Recomendaciones:
1. Evita usar SELECT * si no necesitas todas las columnas.
2. Selecciona únicamente los campos requeridos para reducir transferencia de datos.
3. Mantén alias claros para mejorar la lectura de la consulta.

Sugerencia de índices:
1. Se recomienda revisar un índice sobre customers.city.
2. También puede ser útil un índice sobre orders.customer_id.

Propuesta de reescritura:
SELECT
  c.name,
  c.city,
  o.total,
  o.created_at
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE c.city = 'Bogotá'
ORDER BY o.created_at DESC;`,
              },
              {
                id: 'result-2',
                studentId: 'stu-002',
                studentName: 'Carlos Ruiz',
                submittedAt: '2026-05-18T11:05:00',
                submittedQuery: `SELECT c.name, c.city, o.total
FROM customers c
JOIN orders o ON c.id = o.customer_id
WHERE c.city = 'Bogotá';`,
                result: {
                  submissionId: 'subm-102',
                  status: 'ACCEPTED',
                  score: 88,
                  executionTimeMs: 145,
                },
                assistantFeedback: `La consulta cumple el objetivo principal y evita SELECT *.

Recomendaciones:
1. Mantén alias consistentes.
2. Agrega ORDER BY si el enunciado exige un orden específico.
3. Revisa índices sobre city y customer_id si el volumen de datos crece.`,
              },
              {
                id: 'result-3',
                studentId: 'stu-003',
                studentName: 'María Torres',
                submittedAt: '2026-05-18T11:20:00',
                submittedQuery: `SELECT name
FROM customers
WHERE city = 'Bogotá';`,
                result: {
                  submissionId: 'subm-103',
                  status: 'WRONG_ANSWER',
                  score: 62,
                  executionTimeMs: 98,
                },
                assistantFeedback: `La consulta filtra clientes, pero no incorpora la tabla de órdenes solicitada por el reto.

Recomendaciones:
1. Revisa el enunciado.
2. Agrega el JOIN con orders.
3. Incluye las columnas requeridas por la evaluación.`,
              },
            ],
          },
          {
            id: 'challenge-ordenes-fecha',
            title: 'Órdenes por rango de fechas',
            description: 'Consultar órdenes dentro de un rango de fechas.',
            difficulty: 'Media',
            submissions: [
              {
                id: 'result-4',
                studentId: 'stu-001',
                studentName: 'Laura Gómez',
                submittedAt: '2026-05-18T12:10:00',
                submittedQuery: `SELECT id, customer_id, total, created_at
FROM orders
WHERE created_at BETWEEN '2026-01-01' AND '2026-03-31';`,
                result: {
                  submissionId: 'subm-104',
                  status: 'ACCEPTED',
                  score: 92,
                  executionTimeMs: 170,
                },
                assistantFeedback: `Buena solución. Se recomienda validar si el reto exige ordenamiento descendente.`,
              },
              {
                id: 'result-5',
                studentId: 'stu-002',
                studentName: 'Carlos Ruiz',
                submittedAt: '2026-05-18T12:22:00',
                submittedQuery: `SELECT *
FROM orders
WHERE created_at > '2026-01-01';`,
                result: {
                  submissionId: 'subm-105',
                  status: 'WRONG_ANSWER',
                  score: 70,
                  executionTimeMs: 210,
                },
                assistantFeedback: `La consulta funciona, pero no respeta completamente el rango de fechas solicitado.`,
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
            description: 'Calcular el total vendido agrupado por cliente.',
            difficulty: 'Media',
            submissions: [
              {
                id: 'result-6',
                studentId: 'stu-001',
                studentName: 'Laura Gómez',
                submittedAt: '2026-05-15T15:45:00',
                submittedQuery: `SELECT c.name, SUM(o.total) AS total_orders
FROM customers c
JOIN orders o ON o.customer_id = c.id
GROUP BY c.name
ORDER BY total_orders DESC;`,
                result: {
                  submissionId: 'subm-106',
                  status: 'ACCEPTED',
                  score: 95,
                  executionTimeMs: 180,
                },
                assistantFeedback: `La solución resuelve el reto y aplica correctamente SUM con GROUP BY.

Recomendaciones:
1. Agrupa por el identificador del cliente además del nombre.
2. Usa un alias semántico como total_vendido.`,
              },
              {
                id: 'result-7',
                studentId: 'stu-003',
                studentName: 'María Torres',
                submittedAt: '2026-05-15T16:03:00',
                submittedQuery: `SELECT customer_id, SUM(total)
FROM orders
GROUP BY customer_id;`,
                result: {
                  submissionId: 'subm-107',
                  status: 'ACCEPTED',
                  score: 82,
                  executionTimeMs: 140,
                },
                assistantFeedback: `La agregación es válida, pero podría incluir el nombre del cliente para una respuesta más completa.`,
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
            description: 'Consultar clientes filtrados por ciudad.',
            difficulty: 'Fácil',
            submissions: [
              {
                id: 'result-8',
                studentId: 'stu-001',
                studentName: 'Laura Gómez',
                submittedAt: '2026-05-10T09:12:00',
                submittedQuery: `SELECT name
FROM customers
WHERE city = 'Medellín';`,
                result: {
                  submissionId: 'subm-108',
                  status: 'WRONG_ANSWER',
                  score: 70,
                  executionTimeMs: 90,
                },
                assistantFeedback: `La consulta está bien estructurada, pero no retorna todas las columnas esperadas por el caso de prueba.`,
              },
              {
                id: 'result-9',
                studentId: 'stu-004',
                studentName: 'Andrés Pérez',
                submittedAt: '2026-05-10T09:18:00',
                submittedQuery: `SELECT id, name, city
FROM customers
WHERE city = 'Medellín';`,
                result: {
                  submissionId: 'subm-109',
                  status: 'ACCEPTED',
                  score: 100,
                  executionTimeMs: 85,
                },
                assistantFeedback: `Solución correcta. Retorna las columnas esperadas y aplica correctamente el filtro.`,
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
            description: 'Optimizar una consulta por rango de fechas.',
            difficulty: 'Difícil',
            submissions: [
              {
                id: 'result-10',
                studentId: 'stu-001',
                studentName: 'Laura Gómez',
                submittedAt: '2026-05-20T11:25:00',
                submittedQuery: `SELECT *
FROM orders
WHERE created_at BETWEEN '2026-01-01' AND '2026-03-31'
ORDER BY created_at DESC;`,
                result: {
                  submissionId: 'subm-110',
                  status: 'RUNTIME_ERROR',
                  score: 40,
                  executionTimeMs: 2100,
                },
                assistantFeedback: `La consulta presenta problemas durante la ejecución y debe revisarse antes de considerarse correcta.`,
              },
              {
                id: 'result-11',
                studentId: 'stu-005',
                studentName: 'Daniela Castro',
                submittedAt: '2026-05-20T11:40:00',
                submittedQuery: `SELECT id, customer_id, total, created_at
FROM orders
WHERE created_at >= '2026-01-01'
  AND created_at <= '2026-03-31'
ORDER BY created_at DESC;`,
                result: {
                  submissionId: 'subm-111',
                  status: 'ACCEPTED',
                  score: 90,
                  executionTimeMs: 260,
                },
                assistantFeedback: `Buena solución. Evita SELECT * y expresa correctamente el rango de fechas.`,
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

function getVisibleCourses(courses: CourseResult[], user: any) {
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

  const studentName = String(user?.fullName || user?.name || 'Laura Gómez');

  return courses
    .map((course) => ({
      ...course,
      evaluations: course.evaluations
        .map((evaluation) => ({
          ...evaluation,
          challenges: evaluation.challenges
            .map((challenge) => ({
              ...challenge,
              submissions: challenge.submissions.filter(
                (submission) => submission.studentName === studentName,
              ),
            }))
            .filter((challenge) => challenge.submissions.length > 0),
        }))
        .filter((evaluation) => evaluation.challenges.length > 0),
    }))
    .filter((course) => course.evaluations.length > 0);
}

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

  return course.evaluations.flatMap((evaluation) =>
    evaluation.challenges.flatMap((challenge) => challenge.submissions),
  );
}

function getEvaluationSubmissions(evaluation: EvaluationResult | null) {
  if (!evaluation) return [];

  return evaluation.challenges.flatMap((challenge) => challenge.submissions);
}

function getChallengeAcceptedCount(challenge: ChallengeResult | null) {
  if (!challenge) return 0;

  return challenge.submissions.filter(
    (submission) => submission.result.status === 'ACCEPTED',
  ).length;
}

function getEvaluationAcceptedCount(evaluation: EvaluationResult | null) {
  if (!evaluation) return 0;

  return getEvaluationSubmissions(evaluation).filter(
    (submission) => submission.result.status === 'ACCEPTED',
  ).length;
}

function scrollToSection(sectionId: string) {
  window.setTimeout(() => {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 80);
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
  const normalizedRole = normalizeRole(role);
  const isProfessorView =
    normalizedRole === 'PROFESSOR' ||
    normalizedRole === 'PROFESOR' ||
    normalizedRole === 'ADMIN';

  const visibleCourses = useMemo(() => {
    return getVisibleCourses(mockCourses, user);
  }, [user]);

  const firstCourse = visibleCourses[0] || null;
  const firstEvaluation = firstCourse?.evaluations[0] || null;
  const firstChallenge = firstEvaluation?.challenges[0] || null;
  const firstSubmission = firstChallenge?.submissions[0] || null;

  const [selectedCourseId, setSelectedCourseId] = useState(
    firstCourse?.id || '',
  );
  const [selectedEvaluationId, setSelectedEvaluationId] = useState(
    firstEvaluation?.id || '',
  );
  const [selectedChallengeId, setSelectedChallengeId] = useState(
    firstChallenge?.id || '',
  );
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(
    firstSubmission?.id || '',
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

  useEffect(() => {
    if (!firstCourse) return;

    const courseStillVisible = visibleCourses.some(
      (course) => course.id === selectedCourseId,
    );

    if (!courseStillVisible) {
      setSelectedCourseId(firstCourse.id);
      setSelectedEvaluationId(firstEvaluation?.id || '');
      setSelectedChallengeId(firstChallenge?.id || '');
      setSelectedSubmissionId(firstSubmission?.id || '');
      setSearchTerm('');
      setStatusFilter('ALL');
    }
  }, [
    firstCourse,
    firstEvaluation,
    firstChallenge,
    firstSubmission,
    selectedCourseId,
    visibleCourses,
  ]);

  const selectedCourse = useMemo(() => {
    return (
      visibleCourses.find((course) => course.id === selectedCourseId) ||
      visibleCourses[0] ||
      null
    );
  }, [visibleCourses, selectedCourseId]);

  const selectedEvaluation = useMemo(() => {
    if (!selectedCourse) return null;

    return (
      selectedCourse.evaluations.find(
        (evaluation) => evaluation.id === selectedEvaluationId,
      ) ||
      selectedCourse.evaluations[0] ||
      null
    );
  }, [selectedCourse, selectedEvaluationId]);

  const selectedChallenge = useMemo(() => {
    if (!selectedEvaluation) return null;

    return (
      selectedEvaluation.challenges.find(
        (challenge) => challenge.id === selectedChallengeId,
      ) ||
      selectedEvaluation.challenges[0] ||
      null
    );
  }, [selectedEvaluation, selectedChallengeId]);

  const filteredSubmissions = useMemo(() => {
    if (!selectedChallenge) return [];

    const search = searchTerm.trim().toLowerCase();

    return selectedChallenge.submissions.filter((submission) => {
      const matchesStatus =
        statusFilter === 'ALL' || submission.result.status === statusFilter;

      const searchableText = [
        submission.result.submissionId,
        submission.studentName,
        submission.studentId,
      ]
        .join(' ')
        .toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [selectedChallenge, searchTerm, statusFilter]);

  const selectedSubmission = useMemo(() => {
    return (
      filteredSubmissions.find(
        (submission) => submission.id === selectedSubmissionId,
      ) ||
      filteredSubmissions[0] ||
      null
    );
  }, [filteredSubmissions, selectedSubmissionId]);

  const handleSelectCourse = (courseId: string) => {
    const course = visibleCourses.find((item) => item.id === courseId);

    if (!course) return;

    const evaluation = course.evaluations[0] || null;
    const challenge = evaluation?.challenges[0] || null;
    const submission = challenge?.submissions[0] || null;

    setSelectedCourseId(course.id);
    setSelectedEvaluationId(evaluation?.id || '');
    setSelectedChallengeId(challenge?.id || '');
    setSelectedSubmissionId(submission?.id || '');
    setSearchTerm('');
    setStatusFilter('ALL');

    scrollToSection('results-evaluations-section');
  };

  const handleSelectEvaluation = (evaluationId: string) => {
    if (!selectedCourse) return;

    const evaluation = selectedCourse.evaluations.find(
      (item) => item.id === evaluationId,
    );

    if (!evaluation) return;

    const challenge = evaluation.challenges[0] || null;
    const submission = challenge?.submissions[0] || null;

    setSelectedEvaluationId(evaluation.id);
    setSelectedChallengeId(challenge?.id || '');
    setSelectedSubmissionId(submission?.id || '');
    setSearchTerm('');
    setStatusFilter('ALL');

    scrollToSection('results-challenges-section');
  };

  const handleSelectChallenge = (challengeId: string) => {
    if (!selectedEvaluation) return;

    const challenge = selectedEvaluation.challenges.find(
      (item) => item.id === challengeId,
    );

    if (!challenge) return;

    const submission = challenge.submissions[0] || null;

    setSelectedChallengeId(challenge.id);
    setSelectedSubmissionId(submission?.id || '');
    setSearchTerm('');
    setStatusFilter('ALL');

    scrollToSection('results-submissions-section');
  };

  const handleSelectSubmission = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);
    scrollToSection('results-submission-detail');
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
          <span>{isProfessorView ? 'Resultados' : 'Mis resultados'}</span>

          <h1>
            {isProfessorView
              ? 'Resultados de cursos, evaluaciones y retos'
              : 'Resultados y recomendaciones'}
          </h1>

          <p>
            {isProfessorView
              ? 'Consulta los cursos, sus evaluaciones, los retos y los resultados enviados por los estudiantes.'
              : 'Selecciona un curso, una evaluación y un reto para revisar tus envíos SQL.'}
          </p>
        </div>

        {visibleCourses.length === 0 || !selectedCourse ? (
          <div className="results-empty-state">
            No hay resultados disponibles para este usuario.
          </div>
        ) : (
          <section className="results-workspace">
            <aside className="results-list-panel">
              <div className="results-panel-header">
                <h2>Cursos</h2>
                <p>
                  {normalizedRole === 'ADMIN'
                    ? 'Como administrador puedes ver todos los cursos de todos los profesores.'
                    : isProfessorView
                      ? 'Como profesor solo ves los cursos asignados a tu usuario.'
                      : 'Selecciona el curso donde quieres revisar resultados.'}
                </p>
              </div>

              <div className="course-selector-list">
                {visibleCourses.map((course) => {
                  const submissions = getCourseSubmissions(course);

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
                        {normalizedRole === 'ADMIN' && (
                          <span>{course.professorName}</span>
                        )}
                        <span>{course.evaluations.length} evaluaciones</span>
                        <span>{submissions.length} resultados</span>
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
                    Curso seleccionado
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

              <section
                id="results-evaluations-section"
                className="evaluations-section"
              >
                <div className="results-panel-header compact">
                  <h2>Evaluaciones</h2>
                  <p>Un curso puede contener varias evaluaciones.</p>
                </div>

                <div className="evaluation-selector-list">
                  {selectedCourse.evaluations.map((evaluation) => {
                    const submissions = getEvaluationSubmissions(evaluation);
                    const accepted = getEvaluationAcceptedCount(evaluation);

                    return (
                      <button
                        key={evaluation.id}
                        type="button"
                        className={`evaluation-selector-card ${
                          selectedEvaluation?.id === evaluation.id
                            ? 'active'
                            : ''
                        }`}
                        onClick={() => handleSelectEvaluation(evaluation.id)}
                      >
                        <div>
                          <strong>{evaluation.title}</strong>
                          <p>{evaluation.description}</p>
                        </div>

                        <div className="evaluation-selector-meta">
                          <span>{evaluation.challenges.length} retos</span>
                          <span>{submissions.length} resultados</span>
                          <span>{accepted} aceptados</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {selectedEvaluation && (
                <section
                  id="results-challenges-section"
                  className="challenges-section"
                >
                  <div className="results-panel-header compact">
                    <h2>Retos de la evaluación</h2>
                    <p>
                      Una evaluación puede contener varios retos. Cada reto
                      tiene resultados por estudiante.
                    </p>
                  </div>

                  <div className="challenge-selector-list">
                    {selectedEvaluation.challenges.map((challenge) => {
                      const accepted = getChallengeAcceptedCount(challenge);

                      return (
                        <button
                          key={challenge.id}
                          type="button"
                          className={`challenge-selector-card ${
                            selectedChallenge?.id === challenge.id
                              ? 'active'
                              : ''
                          }`}
                          onClick={() => handleSelectChallenge(challenge.id)}
                        >
                          <div>
                            <strong>{challenge.title}</strong>
                            <p>{challenge.description}</p>
                          </div>

                          <div className="challenge-selector-meta">
                            <span>{challenge.difficulty}</span>
                            <span>{challenge.submissions.length} estudiantes</span>
                            <span>{accepted} aceptados</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              {selectedChallenge && (
                <section
                  id="results-submissions-section"
                  className="submissions-section"
                >
                  <div className="results-panel-header compact">
                    <h2>Resultados por estudiante</h2>

                    <p>
                      Puedes buscar por estudiante, código del estudiante o ID
                      del submission.
                    </p>
                  </div>

                  <div className="results-filters horizontal">
                    <input
                      type="search"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Buscar estudiante o submission..."
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
                          selectedSubmission?.id === submission.id
                            ? 'active'
                            : ''
                        }`}
                        onClick={() => handleSelectSubmission(submission.id)}
                      >
                        <div className="course-submission-main">
                          <div>
                            <strong>{submission.studentName}</strong>

                            <p>
                              {submission.studentId} ·{' '}
                              {selectedChallenge.title}
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
                        No se encontraron resultados con los filtros actuales.
                      </div>
                    )}
                  </div>
                </section>
              )}

              {selectedSubmission && (
                <div
                  id="results-submission-detail"
                  className="submission-detail-section"
                >
                  <div className="results-detail-grid">
                    <div>
                      <span>Estudiante</span>
                      <strong>{selectedSubmission.studentName}</strong>
                    </div>

                    <div>
                      <span>Código</span>
                      <strong>{selectedSubmission.studentId}</strong>
                    </div>

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

                    <div>
                      <span>Submission</span>
                      <strong>{selectedSubmission.result.submissionId}</strong>
                    </div>
                  </div>

                  <div className="results-score-card">
                    <div>
                      <span>Puntaje obtenido</span>
                      <strong>{selectedSubmission.result.score}/100</strong>
                    </div>

                    <div className="results-score-track">
                      <div
                        className="results-score-fill"
                        style={{
                          width: `${selectedSubmission.result.score}%`,
                        }}
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
                    <h3>Retroalimentación del asistente</h3>
                    <div className="assistant-single-text">
                      {selectedSubmission.assistantFeedback}
                    </div>
                  </section>
                </div>
              )}
            </article>
          </section>
        )}
      </section>
    </DashboardLayout>
  );
}

export default ResultsPage;