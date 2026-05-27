import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import type { Challenge, Evaluation } from '../../domain/evaluationChallenge.types';
import { courseApi } from '../../../courses/infrastructure/courseApi';
import type { Course, CourseListResponse } from '../../../courses/domain/course.types';
import { evaluationApi } from '../../infrastructure/evaluationApi';
import { evaluationChallengeApi } from '../../infrastructure/evaluationChallengeApi';
import '../styles/ProfessorEvaluationsPage.css';

type ApiListResponse<T> =
  | T[]
  | {
      data: T[];
      total?: number;
      page?: number;
      limit?: number;
    };

function normalizeList<T>(response: ApiListResponse<T> | null | undefined): T[] {
  if (!response) {
    return [];
  }

  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

function formatDate(value?: string) {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getEvaluationStatusLabel(status?: string) {
  return status === 'INACTIVE' ? 'Inactiva' : 'Activa';
}

function getDifficultyLabel(value?: string) {
  if (value === 'HARD') {
    return 'Difícil';
  }

  if (value === 'MEDIUM') {
    return 'Media';
  }

  return 'Fácil';
}

function getVisibilityLabel(value?: string) {
  if (value === 'PRIVATE') {
    return 'Privado';
  }

  return 'Público';
}

function getChallengeEngine(value?: string) {
  return value || 'Sin motor';
}

export default function ProfessorEvaluationsPage() {
  const navigate = useNavigate();
  const { courseId: routeCourseId } = useParams<{ courseId?: string }>();
  const coursesRailRef = useRef<HTMLDivElement | null>(null);

  const [session] = useState(() => ({
    token: authStorage.getToken(),
    user: authStorage.getUser(),
  }));

  const token = session.token;
  const user = session.user;
  const role = user?.role as DashboardRole | undefined;
  const isProfessor = role === 'PROFESSOR';

  const [courses, setCourses] = useState<Course[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    routeCourseId ?? null,
  );
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<
    number | null
  >(null);
  const [challengeList, setChallengeList] = useState<Challenge[]>([]);

  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [isLoadingEvaluations, setIsLoadingEvaluations] = useState(false);
  const [isLoadingChallenges, setIsLoadingChallenges] = useState(false);

  const [courseError, setCourseError] = useState('');
  const [evaluationError, setEvaluationError] = useState('');
  const [challengeError, setChallengeError] = useState('');

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true });
    }
  }, [navigate, token, user]);

  useEffect(() => {
    if (routeCourseId && routeCourseId !== selectedCourseId) {
      setSelectedCourseId(routeCourseId);
    }
  }, [routeCourseId, selectedCourseId]);

  useEffect(() => {
    if (!isProfessor || !token || !user?.id) {
      return;
    }

    const professorId = user.id;
    const authToken = token;

    let cancelled = false;

    async function loadCourses() {
      try {
        setIsLoadingCourses(true);
        setCourseError('');

        const response: CourseListResponse = await courseApi.findByProfessor(
          professorId,
          authToken,
        );

        const loadedCourses = normalizeList<Course>(response);

        if (cancelled) {
          return;
        }

        setCourses(loadedCourses);
        setSelectedCourseId((currentSelectedId) => {
          const currentSelection =
            currentSelectedId &&
            loadedCourses.some((course) => course.id === currentSelectedId)
              ? currentSelectedId
              : null;

          const routeSelection = routeCourseId
            ? loadedCourses.find((course) => course.id === routeCourseId)?.id ??
              null
            : null;

          return routeSelection ?? currentSelection ?? loadedCourses[0]?.id ?? null;
        });

        if (loadedCourses.length === 0) {
          setSelectedCourseId(null);
          setEvaluations([]);
          setSelectedEvaluationId(null);
          setChallengeList([]);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCourses([]);
        setSelectedCourseId(null);
        setEvaluations([]);
        setSelectedEvaluationId(null);
        setChallengeList([]);
        setCourseError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar los cursos del profesor.',
        );
      } finally {
        if (!cancelled) {
          setIsLoadingCourses(false);
        }
      }
    }

    void loadCourses();

    return () => {
      cancelled = true;
    };
  }, [isProfessor, routeCourseId, token, user?.id]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  useEffect(() => {
    if (!isProfessor || !token || !selectedCourse) {
      setEvaluations([]);
      setSelectedEvaluationId(null);
      setChallengeList([]);
      return;
    }

    const currentCourse = selectedCourse;
    const authToken = token;

    let cancelled = false;

    async function loadEvaluations() {
      try {
        setIsLoadingEvaluations(true);
        setEvaluationError('');

        const response = await evaluationApi.listForProfessor(
          currentCourse.id,
          { page: 1, limit: 50, visibility: 'all' },
          authToken,
        );

        const loadedEvaluations = normalizeList<Evaluation>(
          response as ApiListResponse<Evaluation>,
        ).map((evaluation) => ({
          ...evaluation,
          courseName: evaluation.courseName || currentCourse.name,
          challenges: Array.isArray(evaluation.challenges)
            ? evaluation.challenges
            : [],
        }));

        if (cancelled) {
          return;
        }

        setEvaluations(loadedEvaluations);
        setSelectedEvaluationId(loadedEvaluations[0]?.id ?? null);
        setChallengeList([]);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setEvaluations([]);
        setSelectedEvaluationId(null);
        setChallengeList([]);
        setEvaluationError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar las evaluaciones de este curso.',
        );
      } finally {
        if (!cancelled) {
          setIsLoadingEvaluations(false);
        }
      }
    }

    void loadEvaluations();

    return () => {
      cancelled = true;
    };
  }, [isProfessor, selectedCourse, token]);

  const selectedEvaluation = useMemo(
    () =>
      evaluations.find((evaluation) => evaluation.id === selectedEvaluationId) ??
      null,
    [evaluations, selectedEvaluationId],
  );

  useEffect(() => {
    if (!isProfessor || !token || !selectedEvaluation) {
      setChallengeList([]);
      return;
    }

    const currentEvaluation = selectedEvaluation;
    const authToken = token;

    let cancelled = false;

    async function loadChallenges() {
      try {
        setIsLoadingChallenges(true);
        setChallengeError('');

        const response = await evaluationChallengeApi.listByEvaluation(
          String(currentEvaluation.id),
          { page: 1, limit: 50, visibility: 'all' },
          authToken,
        );

        const loadedChallenges = normalizeList<Challenge>(
          response as ApiListResponse<Challenge>,
        );

        if (cancelled) {
          return;
        }

        setChallengeList(loadedChallenges);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setChallengeList([]);
        setChallengeError(
          error instanceof Error
            ? error.message
            : 'No fue posible cargar los retos de la evaluación.',
        );
      } finally {
        if (!cancelled) {
          setIsLoadingChallenges(false);
        }
      }
    }

    void loadChallenges();

    return () => {
      cancelled = true;
    };
  }, [isProfessor, selectedEvaluation, token]);

  const totalChallenges = useMemo(
    () => evaluations.reduce((total, evaluation) => total + (evaluation.challenges?.length ?? 0), 0),
    [evaluations],
  );

  const selectedCourseStats = useMemo(
    () => ({
      evaluations: evaluations.length,
      challenges: challengeList.length,
    }),
    [evaluations.length, challengeList.length],
  );

  const scrollCourses = (direction: 'left' | 'right') => {
    const rail = coursesRailRef.current;

    if (!rail) {
      return;
    }

    const scrollAmount = Math.max(260, rail.clientWidth * 0.8);

    rail.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    setSelectedEvaluationId(null);
    setChallengeList([]);
    setEvaluationError('');
    setChallengeError('');
    navigate(`/evaluation/${courseId}`);
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
      <section className="prof-eval-page">
        
 

        {courseError && <div className="prof-eval-alert">{courseError}</div>}
        {evaluationError && (
          <div className="prof-eval-alert">{evaluationError}</div>
        )}
        {challengeError && (
          <div className="prof-eval-alert">{challengeError}</div>
        )}

        {!isProfessor ? (
          <div className="prof-eval-empty">
            Esta vista está pensada para profesores.
          </div>
        ) : (
          <div className="prof-eval-stack">
            <section className="prof-eval-panel prof-eval-course-panel">
              <div className="prof-eval-panel-header">
                <div>
                  <span className="prof-eval-panel-label">Cursos</span>
                  <h2>Mis cursos</h2>
                </div>

                <div className="prof-eval-carousel-actions">
                  <button
                    type="button"
                    className="prof-eval-icon-button"
                    onClick={() => scrollCourses('left')}
                    aria-label="Desplazar cursos a la izquierda"
                    title="Anterior"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    className="prof-eval-icon-button"
                    onClick={() => scrollCourses('right')}
                    aria-label="Desplazar cursos a la derecha"
                    title="Siguiente"
                  >
                    ›
                  </button>
                </div>
              </div>

              {isLoadingCourses ? (
                <div className="prof-eval-loading">Cargando cursos...</div>
              ) : courses.length === 0 ? (
                <div className="prof-eval-empty">
                  No hay cursos asignados para este profesor.
                </div>
              ) : (
                <div className="prof-eval-course-rail" ref={coursesRailRef}>
                  {courses.map((course) => {
                    const isActive = course.id === selectedCourseId;

                    return (
                      <button
                        key={course.id}
                        type="button"
                        className={
                          isActive
                            ? 'prof-eval-course-card is-active'
                            : 'prof-eval-course-card'
                        }
                        onClick={() => handleSelectCourse(course.id)}
                      >
                        <div className="prof-eval-course-topline">
                          <span className="prof-eval-course-code">
                            {course.code}
                          </span>
                          {isActive && (
                            <span className="prof-eval-course-pill">
                              Seleccionado
                            </span>
                          )}
                        </div>

                        <strong>{course.name}</strong>
                        <p>
                          {course.period} · Grupo {course.group}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="prof-eval-panel prof-eval-detail-panel">
              <div className="prof-eval-panel-header">
                <div>
                  <span className="prof-eval-panel-label">Detalle</span>
                  <h2>
                    {selectedCourse
                      ? selectedCourse.name
                      : 'Selecciona un curso'}
                  </h2>
                  <p>
                    {selectedCourse
                      ? `${selectedCourse.code} · ${selectedCourse.period} · Grupo ${selectedCourse.group}`
                      : 'Debajo aparecerán las evaluaciones y retos del curso seleccionado.'}
                  </p>
                </div>

                <div className="prof-eval-detail-summary">
                  <span>
                    <strong>{selectedCourseStats.evaluations}</strong>
                    Evaluaciones
                  </span>
                  <span>
                    <strong>{selectedCourseStats.challenges}</strong>
                    Retos cargados
                  </span>
                </div>
              </div>

              {!selectedCourse ? (
                <div className="prof-eval-empty prof-eval-detail-empty">
                  Elige un curso para consultar sus evaluaciones.
                </div>
              ) : (
                <>
                  <div className="prof-eval-subpanel">
                    <div className="prof-eval-subpanel-header">
                      <div>
                        <span className="prof-eval-panel-label">
                          Evaluaciones
                        </span>
                        <h3>Listado de evaluaciones del curso</h3>
                      </div>
                    </div>

                    {isLoadingEvaluations ? (
                      <div className="prof-eval-loading">
                        Cargando evaluaciones...
                      </div>
                    ) : evaluations.length === 0 ? (
                      <div className="prof-eval-empty">
                        Este curso todavía no tiene evaluaciones.
                      </div>
                    ) : (
                      <div className="prof-eval-evaluation-list">
                        {evaluations.map((evaluation) => {
                          const isSelected = evaluation.id === selectedEvaluationId;

                          return (
                            <button
                              key={evaluation.id}
                              type="button"
                              className={
                                isSelected
                                  ? 'prof-eval-evaluation-card is-selected'
                                  : 'prof-eval-evaluation-card'
                              }
                              onClick={() => setSelectedEvaluationId(evaluation.id)}
                            >
                              <div className="prof-eval-evaluation-topline">
                                <strong>{evaluation.title}</strong>
                                <span
                                  className={
                                    evaluation.status === 'INACTIVE'
                                      ? 'prof-eval-status is-inactive'
                                      : 'prof-eval-status is-active'
                                  }
                                >
                                  {getEvaluationStatusLabel(evaluation.status)}
                                </span>
                              </div>

                              <p>{evaluation.description}</p>

                              <div className="prof-eval-evaluation-meta">
                                <span>Inicio: {formatDate(evaluation.startDate)}</span>
                                <span>Cierre: {formatDate(evaluation.endDate)}</span>
                                <span>
                                  Duración: {evaluation.durationMinutes} min
                                </span>
                                <span>Intentos: {evaluation.maxAttempts}</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="prof-eval-subpanel">
                    <div className="prof-eval-subpanel-header">
                      <div>
                        <span className="prof-eval-panel-label">Retos</span>
                        <h3>
                          {selectedEvaluation
                            ? selectedEvaluation.title
                            : 'Selecciona una evaluación'}
                        </h3>
                      </div>
                    </div>

                    {!selectedEvaluation ? (
                      <div className="prof-eval-empty">
                        Selecciona una evaluación para ver sus retos.
                      </div>
                    ) : isLoadingChallenges ? (
                      <div className="prof-eval-loading">
                        Cargando retos...
                      </div>
                    ) : challengeList.length === 0 ? (
                      <div className="prof-eval-empty">
                        Esta evaluación todavía no tiene retos asociados.
                      </div>
                    ) : (
                      <div className="prof-eval-challenge-list">
                        {challengeList.map((challenge) => (
                          <article className="prof-eval-challenge-card" key={challenge.id}>
                            <div className="prof-eval-challenge-topline">
                              <div>
                                <strong>{challenge.title}</strong>
                                <p>{challenge.description}</p>
                              </div>
                              <span className="prof-eval-visibility">
                                {getVisibilityLabel(challenge.visibility)}
                              </span>
                            </div>

                            <div className="prof-eval-challenge-meta">
                              <span>{getChallengeEngine(challenge.databaseEngine)}</span>
                              <span>Límite: {challenge.timeLimitMs} ms</span>
                              <span>{getDifficultyLabel(challenge.difficulty)}</span>
                              <span>Puntos: {challenge.points}</span>
                            </div>
                          </article>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
