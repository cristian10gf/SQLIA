import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import { courseApi } from '../../../courses/infrastructure/courseApi';
import { evaluationApi } from '../../../evaluationsAndChallenges/infrastructure/evaluationApi';
import { evaluationChallengeApi } from '../../../evaluationsAndChallenges/infrastructure/evaluationChallengeApi';
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

  const [fetchedCourses, setFetchedCourses] = useState<CourseResult[]>([]);

  const visibleCourses = useMemo(() => {
    return getVisibleCourses(fetchedCourses, user);
  }, [fetchedCourses, user]);

  useEffect(() => {
    if (!token || !user) return;

    let cancelled = false;

    const authToken = token as string;
    const userId = String(user.id);

    async function normalizeResponse(response: any) {
      if (!response) return [];
      if (Array.isArray(response)) return response;
      if (response?.data && Array.isArray(response.data)) return response.data;
      return [];
    }

    async function loadAll() {
      try {
        let coursesResp: any;

        if (normalizedRole === 'ADMIN') {
          coursesResp = await courseApi.findAll(authToken);
        } else if (normalizedRole === 'PROFESSOR' || normalizedRole === 'PROFESOR') {
          coursesResp = await courseApi.findByProfessor(userId, authToken);
        } else {
          coursesResp = await courseApi.findByStudent(userId, authToken);
        }

        const coursesList: any[] = await normalizeResponse(coursesResp);

        const mapped = await Promise.all(
          coursesList.map(async (c: any) => {
            // load evaluations
            let evalResp: any;
            try {
              if (isProfessorView) {
                evalResp = await evaluationApi.listForProfessor(String(c.id), { page: 1, limit: 100, visibility: 'all' }, authToken);
              } else {
                evalResp = await evaluationApi.listVisibleForStudent(String(c.id), 1, 100, authToken);
              }
            } catch {
              evalResp = [];
            }

            const evalList: any[] = Array.isArray(evalResp?.data?.data)
              ? evalResp.data.data
              : Array.isArray(evalResp?.data)
              ? evalResp.data
              : Array.isArray(evalResp)
              ? evalResp
              : [];

            const evaluations = await Promise.all(
              evalList.map(async (ev: any) => {
                // load challenges
                let chResp: any;
                try {
                  if (isProfessorView) {
                    chResp = await evaluationChallengeApi.listByEvaluation(String(ev.id), { page: 1, limit: 200, visibility: 'all' }, authToken);
                  } else {
                    chResp = await evaluationChallengeApi.listByEvaluationForStudent(String(ev.id), authToken);
                  }
                } catch {
                  chResp = [];
                }

                const chList: any[] = Array.isArray(chResp?.data)
                  ? chResp.data
                  : Array.isArray(chResp)
                  ? chResp
                  : Array.isArray(chResp?.data?.data)
                  ? chResp.data.data
                  : [];

                return {
                  id: String(ev.id),
                  title: ev.title ?? ev.name ?? 'Sin título',
                  description: ev.description ?? '',
                  challenges: chList.map((ch: any) => ({
                    id: String(ch.id),
                    title: ch.title ?? ch.name ?? 'Reto',
                    description: ch.description ?? '',
                    difficulty: ch.difficulty ?? 'Media',
                    submissions: [] as SubmissionItem[],
                  })),
                } as EvaluationResult;
              }),
            );

            return {
              id: String(c.id),
              professorId: String(c.professorId ?? ''),
              professorName: c.professorName ?? '',
              name: c.name ?? c.title ?? 'Curso',
              code: c.code ?? '',
              group: c.group ?? '',
              period: c.period ?? '',
              evaluations,
            } as CourseResult;
          }),
        );

        if (!cancelled) {
          setFetchedCourses(mapped);
        }
      } catch (err) {
        // ignore errors for now
      }
    }

    void loadAll();

    return () => {
      cancelled = true;
    };
  }, [token, user?.id, normalizedRole, isProfessorView]);

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