import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type {
  Challenge,
  ChallengeStatus,
  Difficulty,
  Evaluation,
  EvaluationStatus,
} from '../../domain/evaluationChallenge.types';
import '../styles/EvaluationsAndChallengesPage.css';
import { evaluationApi } from '../../infrastructure/evaluationApi';
import { challengeApi } from '../../infrastructure/challengeApi';
import { evaluationChallengeApi } from '../../infrastructure/evaluationChallengeApi';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';

type UserRole = 'ADMIN' | 'PROFESSOR' | 'STUDENT';
type StudentEvaluationFilter = 'AVAILABLE' | 'UNAVAILABLE' | 'ALL';

interface SessionUser {
  name: string;
  role: UserRole;
}

interface ActiveStudentAttempt {
  evaluationId: number;
  challengeId: number;
  startedAt: number;
  durationMinutes: number;
}

const sampleSchemaSql = `CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(80) NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  total DECIMAL(10,2) NOT NULL,
  created_at DATE NOT NULL
);`;

const sampleInitialDataSql = `INSERT INTO customers (name, city) VALUES
('Ana Pérez', 'Bogotá'),
('Carlos Ruiz', 'Medellín'),
('Laura Gómez', 'Cali');

INSERT INTO orders (customer_id, total, created_at) VALUES
(1, 150000, '2026-01-10'),
(1, 200000, '2026-01-12'),
(2, 90000, '2026-01-13');`;

const emptyEvaluation: Omit<Evaluation, 'id'> = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  status: 'ACTIVE',
  durationMinutes: 90,
  maxAttempts: 3,
  courseName: '',
  challenges: [],
};

const emptyChallenge: Omit<Challenge, 'id'> = {
  title: '',
  description: '',
  difficulty: 'EASY',
  databaseEngine: 'PostgreSQL',
  timeLimitMs: 2000,
  visibility: 'PUBLIC',
  points: 10,
  schemaDefinition: sampleSchemaSql,
  seedScript: sampleInitialDataSql,
  expectedResult: '',
};

function normalizeRole(value?: string | null): UserRole {
  const normalized = value?.toUpperCase();

  if (normalized === 'PROFESSOR' || normalized === 'PROFESOR') {
    return 'PROFESSOR';
  }

  if (normalized === 'STUDENT' || normalized === 'ESTUDIANTE') {
    return 'STUDENT';
  }

  return 'ADMIN';
}

function getSessionUser(): SessionUser {
  const keys = ['user', 'authUser', 'currentUser', 'sqlia_user'];

  for (const key of keys) {
    const raw = localStorage.getItem(key);

    if (!raw) continue;

    try {
      const parsed = JSON.parse(raw);

      return {
        name:
          parsed.name ||
          parsed.fullName ||
          parsed.username ||
          parsed.email ||
          'Usuario SQLIA',
        role: normalizeRole(parsed.role),
      };
    } catch {
      continue;
    }
  }

  return {
    name: localStorage.getItem('name') || 'Usuario SQLIA',
    role: normalizeRole(
      localStorage.getItem('role') || localStorage.getItem('userRole'),
    ),
  };
}

function getDifficultyLabel(difficulty: Difficulty) {
  if (difficulty === 'EASY') return 'Fácil';
  if (difficulty === 'MEDIUM') return 'Media';
  return 'Difícil';
}

function getStatusLabel(status: EvaluationStatus) {
  if (status === 'ACTIVE') return 'Activa';
  return 'Inactiva';
}

function getChallengeStatusLabel(status: ChallengeStatus) {
  if (status === 'PUBLIC') return 'Público';
  if (status === 'PRIVATE') return 'Privado';
  return 'Archivado';
}

function formatDate(date: string) {
  if (!date) return 'Sin fecha';
  return new Date(date).toLocaleDateString();
}

function isEvaluationOpen(evaluation: Evaluation) {
  const now = new Date();
  const start = new Date(evaluation.startDate);
  const end = new Date(evaluation.endDate);

  return now >= start && now <= end;
}

function isChallengeAvailableForStudent(
  evaluation: Evaluation,
  challenge: Challenge,
) {
  return isEvaluationOpen(evaluation) && challenge.visibility === 'PUBLIC';
}

function formatAttemptCountdown(milliseconds: number) {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (value: number) => value.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function getAttemptRemainingMs(attempt: ActiveStudentAttempt, currentTime: Date) {
  const durationMs = Math.max(1, attempt.durationMinutes) * 60 * 1000;
  const elapsedMs = currentTime.getTime() - attempt.startedAt;

  return Math.max(0, durationMs - elapsedMs);
}

export default function EvaluationsAndChallengesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [session] = useState(() => ({
    token: authStorage.getToken(),
    user: authStorage.getUser(),
  }));

  const token = session.token;
  const storedUser = session.user;

  const sessionUser = getSessionUser();
  const [role] = useState<UserRole>(sessionUser.role);

  const isAdmin = role === 'ADMIN';
  const isProfessor = role === 'PROFESSOR';
  const isStudent = role === 'STUDENT';

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [evaluationForm, setEvaluationForm] =
    useState<Omit<Evaluation, 'id'>>(emptyEvaluation);
  const [challengeForm, setChallengeForm] =
    useState<Omit<Challenge, 'id'>>(emptyChallenge);

  const [editingEvaluationId, setEditingEvaluationId] = useState<number | null>(
    null,
  );
  const [editingChallengeId, setEditingChallengeId] = useState<number | null>(
    null,
  );

  const [selectedEvaluationId, setSelectedEvaluationId] = useState<
    number | null
  >(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [studentFilter, setStudentFilter] =
    useState<StudentEvaluationFilter>('AVAILABLE');

  const [actionMessage, setActionMessage] = useState('');
  const [formError, setFormError] = useState('');

  const [studentSolutions, setStudentSolutions] = useState<
    Record<number, string>
  >({});
  const [studentSolutionMessages, setStudentSolutionMessages] = useState<
    Record<number, string>
  >({});

  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [activeStudentAttempt, setActiveStudentAttempt] =
    useState<ActiveStudentAttempt | null>(null);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const loadData = async () => {
    if (!courseId || !token) return;

    try {
      const response: any =
        role === 'PROFESSOR'
          ? await evaluationApi.listForProfessor(courseId, { limit: 50 }, token)
          : await evaluationApi.listVisibleForStudent(courseId, 1, 50, token);

      const rawData = response?.data || response;
      const evaluationsData = Array.isArray(rawData) ? rawData : [];

      const enrichedEvaluations = await Promise.all(
        evaluationsData.map(async (evaluation: Evaluation) => {
          try {
            const challengeResponse: any =
              role === 'PROFESSOR'
                ? await evaluationChallengeApi.listByEvaluation(
                    evaluation.id.toString(),
                    {},
                    token,
                  )
                : await evaluationChallengeApi.listByEvaluationForStudent(
                    evaluation.id.toString(),
                    token,
                  );

            return {
              ...evaluation,
              challenges: challengeResponse?.data || challengeResponse || [],
            };
          } catch {
            return {
              ...evaluation,
              challenges: [],
            };
          }
        }),
      );

      setEvaluations(enrichedEvaluations);
    } catch (error) {
      console.error('Error cargando evaluaciones:', error);
      setEvaluations([]);
      setActionMessage('Error al cargar las evaluaciones.');
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId, token, role]);

  const selectedEvaluation = useMemo(() => {
    if (!selectedEvaluationId) return null;

    return (
      evaluations.find((evaluation) => evaluation.id === selectedEvaluationId) ||
      null
    );
  }, [selectedEvaluationId, evaluations]);

  const activeAttemptEvaluation = useMemo(() => {
    if (!activeStudentAttempt) return null;

    return (
      evaluations.find(
        (evaluation) => evaluation.id === activeStudentAttempt.evaluationId,
      ) || null
    );
  }, [activeStudentAttempt, evaluations]);

  const activeAttemptChallenge = useMemo(() => {
    if (!activeStudentAttempt || !activeAttemptEvaluation) return null;

    return (
      activeAttemptEvaluation.challenges?.find(
        (challenge) => challenge.id === activeStudentAttempt.challengeId,
      ) || null
    );
  }, [activeStudentAttempt, activeAttemptEvaluation]);

  const activeAttemptRemainingMs = activeStudentAttempt
    ? getAttemptRemainingMs(activeStudentAttempt, currentTime)
    : 0;

  const activeAttemptExpired = Boolean(
    activeStudentAttempt && activeAttemptRemainingMs <= 0,
  );

  const publishedChallenges = useMemo(() => {
    return evaluations.reduce((total, evaluation) => {
      return (
        total +
        (evaluation.challenges?.filter(
          (challenge) => challenge.visibility === 'PUBLIC',
        ).length || 0)
      );
    }, 0);
  }, [evaluations]);

  const nextClosingDate = useMemo(() => {
    const activeEvaluations = evaluations.filter(
      (evaluation) => evaluation.status === 'ACTIVE',
    );

    if (activeEvaluations.length === 0) return 'Sin fecha';

    const ordered = [...activeEvaluations].sort((a, b) =>
      a.endDate.localeCompare(b.endDate),
    );

    return formatDate(ordered[0].endDate);
  }, [evaluations]);

  const filteredEvaluations = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return evaluations
      .map((evaluation) => {
        let challenges = evaluation.challenges || [];

        if (isStudent) {
          if (studentFilter === 'AVAILABLE') {
            challenges = isEvaluationOpen(evaluation)
              ? challenges.filter(
                  (challenge) => challenge.visibility === 'PUBLIC',
                )
              : [];
          }

          if (studentFilter === 'UNAVAILABLE') {
            challenges = challenges.filter(
              (challenge) =>
                challenge.visibility !== 'PUBLIC' ||
                !isEvaluationOpen(evaluation),
            );
          }
        }

        return {
          ...evaluation,
          challenges,
        };
      })
      .filter((evaluation) => {
        if (isStudent && studentFilter !== 'ALL') {
          if ((evaluation.challenges?.length || 0) === 0) return false;
        }

        if (!normalizedSearch) return true;

        const searchableText = [
          evaluation.title,
          evaluation.description,
          evaluation.courseName,
          ...(evaluation.challenges || []).map((challenge) => challenge.title),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(normalizedSearch);
      });
  }, [evaluations, searchTerm, studentFilter, isStudent, currentTime]);

  const clearEvaluationForm = () => {
    setEvaluationForm(emptyEvaluation);
    setChallengeForm(emptyChallenge);
    setEditingEvaluationId(null);
    setEditingChallengeId(null);
    setSelectedEvaluationId(null);
    setFormError('');
  };

  const handleEvaluationChange = (
    field: keyof Omit<Evaluation, 'id' | 'challenges'>,
    value: string | number | EvaluationStatus,
  ) => {
    setEvaluationForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormError('');
    setActionMessage('');
  };

  const handleChallengeChange = (
    field: keyof Omit<Challenge, 'id'>,
    value: string | number | Difficulty | ChallengeStatus,
  ) => {
    setChallengeForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormError('');
    setActionMessage('');
  };

  const validateEvaluationForm = () => {
    if (!evaluationForm.title.trim()) {
      return 'El nombre de la evaluación es obligatorio.';
    }

    if (!evaluationForm.description.trim()) {
      return 'La descripción de la evaluación es obligatoria.';
    }

    if (!evaluationForm.startDate) {
      return 'La fecha de inicio es obligatoria.';
    }

    if (!evaluationForm.endDate) {
      return 'La fecha de cierre es obligatoria.';
    }

    if (new Date(evaluationForm.endDate) < new Date(evaluationForm.startDate)) {
      return 'La fecha de cierre no puede ser anterior a la fecha de inicio.';
    }

    if (!evaluationForm.durationMinutes || evaluationForm.durationMinutes < 1) {
      return 'La duración debe ser mayor a 0 minutos.';
    }

    if (!evaluationForm.maxAttempts || evaluationForm.maxAttempts < 1) {
      return 'Los intentos máximos deben ser mínimo 1.';
    }

    return '';
  };

  const validateChallengeForm = () => {
    if (!editingEvaluationId) {
      return 'Primero guarda o edita una evaluación para agregar retos.';
    }

    if (!challengeForm.title.trim()) {
      return 'El título del reto es obligatorio.';
    }

    if (!challengeForm.description.trim()) {
      return 'La descripción del reto es obligatoria.';
    }

    if (!challengeForm.databaseEngine.trim()) {
      return 'El motor de base de datos es obligatorio.';
    }

    if (!challengeForm.timeLimitMs || challengeForm.timeLimitMs < 500) {
      return 'El límite de ejecución debe ser mínimo 500 ms.';
    }

    if (!challengeForm.points || challengeForm.points < 1) {
      return 'Los puntos deben ser mayores o iguales a 1.';
    }

    return '';
  };

  const handleSaveEvaluation = async () => {
    const error = validateEvaluationForm();

    if (error) {
      setFormError(error);
      return;
    }

    if (!token || !courseId) return;

    try {
      const { challenges, courseName, status, ...payload } = evaluationForm;

      const finalPayload = {
        ...payload,
        courseId,
      };

      if (editingEvaluationId) {
        await evaluationApi.update(
          editingEvaluationId.toString(),
          finalPayload,
          token,
        );

        setActionMessage('Evaluación actualizada correctamente.');
      } else {
        await evaluationApi.create(finalPayload, token);
        setActionMessage('Evaluación creada correctamente.');
      }

      clearEvaluationForm();
      await loadData();
    } catch (error) {
      console.error('Error guardando evaluación:', error);
      setFormError('No se pudo guardar la evaluación.');
    }
  };

  const handleEditEvaluation = (evaluation: Evaluation) => {
    setEditingEvaluationId(evaluation.id);
    setSelectedEvaluationId(evaluation.id);
    setEditingChallengeId(null);

    setEvaluationForm({
      title: evaluation.title || '',
      description: evaluation.description || '',
      startDate: evaluation.startDate?.split('T')[0] || '',
      endDate: evaluation.endDate?.split('T')[0] || '',
      status: evaluation.status || 'ACTIVE',
      durationMinutes: evaluation.durationMinutes || 90,
      maxAttempts: evaluation.maxAttempts || 3,
      courseName: evaluation.courseName || '',
      challenges: evaluation.challenges || [],
    });

    setChallengeForm(emptyChallenge);
    setFormError('');
    setActionMessage('');
  };

  const handleDeleteEvaluation = async (evaluationId: number) => {
    if (!token) return;

    try {
      await evaluationApi.remove(evaluationId.toString(), token);
      setActionMessage('Evaluación eliminada correctamente.');
      clearEvaluationForm();
      await loadData();
    } catch (error) {
      console.error('Error eliminando evaluación:', error);
      setFormError('No se pudo eliminar la evaluación.');
    }
  };

  const parseExpectedResult = () => {
    const raw = challengeForm.expectedResult;

    if (!raw || typeof raw !== 'string') return raw;

    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  const handleSaveChallenge = async () => {
    const error = validateChallengeForm();

    if (error) {
      setFormError(error);
      return;
    }

    if (!token || !courseId || !editingEvaluationId) return;

    try {
      const { points, ...challengeData } = challengeForm;

      const challengePayload = {
        ...challengeData,
        expectedResult: parseExpectedResult(),
        courseId,
        timeLimitMs: Number(challengeForm.timeLimitMs),
      };

      if (editingChallengeId) {
        await challengeApi.update(
          editingChallengeId.toString(),
          challengePayload,
          token,
        );

        await evaluationChallengeApi.updateAssociation(
          editingEvaluationId.toString(),
          editingChallengeId.toString(),
          { points: Number(points) },
          token,
        );

        setActionMessage('Reto actualizado correctamente.');
      } else {
        const challengeResponse: any = await challengeApi.create(
          challengePayload,
          token,
        );

        const createdChallenge = challengeResponse?.data || challengeResponse;

        await evaluationChallengeApi.associate(
          {
            evaluationId: editingEvaluationId.toString(),
            challengeId: createdChallenge.id,
            points: Number(points),
            orderIndex:
              (selectedEvaluation?.challenges?.length ||
                evaluationForm.challenges?.length ||
                0) + 1,
          },
          token,
        );

        setActionMessage('Reto agregado correctamente.');
      }

      setChallengeForm(emptyChallenge);
      setEditingChallengeId(null);
      await loadData();
    } catch (error) {
      console.error('Error guardando reto:', error);
      setFormError('No se pudo guardar el reto.');
    }
  };

  const handleEditChallenge = (evaluation: Evaluation, challenge: Challenge) => {
    setEditingEvaluationId(evaluation.id);
    setSelectedEvaluationId(evaluation.id);
    setEditingChallengeId(challenge.id);

    setEvaluationForm({
      title: evaluation.title || '',
      description: evaluation.description || '',
      startDate: evaluation.startDate?.split('T')[0] || '',
      endDate: evaluation.endDate?.split('T')[0] || '',
      status: evaluation.status || 'ACTIVE',
      durationMinutes: evaluation.durationMinutes || 90,
      maxAttempts: evaluation.maxAttempts || 3,
      courseName: evaluation.courseName || '',
      challenges: evaluation.challenges || [],
    });

    setChallengeForm({
      title: challenge.title || '',
      description: challenge.description || '',
      difficulty: challenge.difficulty || 'EASY',
      databaseEngine: challenge.databaseEngine || 'PostgreSQL',
      timeLimitMs: challenge.timeLimitMs || 2000,
      visibility: challenge.visibility || 'PUBLIC',
      points: challenge.points || 10,
      schemaDefinition: challenge.schemaDefinition || sampleSchemaSql,
      seedScript: challenge.seedScript || sampleInitialDataSql,
      expectedResult:
        typeof challenge.expectedResult === 'string'
          ? challenge.expectedResult
          : JSON.stringify(challenge.expectedResult || '', null, 2),
    });

    setFormError('');
    setActionMessage('');
  };

  const handleDeleteChallenge = async (
    evaluationId: number,
    challengeId: number,
  ) => {
    if (!token) return;

    try {
      await evaluationChallengeApi.removeAssociation(
        evaluationId.toString(),
        challengeId.toString(),
        token,
      );

      await challengeApi.remove(challengeId.toString(), token);

      setActionMessage('Reto eliminado correctamente.');
      await loadData();
    } catch (error) {
      console.error('Error eliminando reto:', error);
      setFormError('No se pudo eliminar el reto.');
    }
  };

  const handleOpenDetail = (evaluationId: number) => {
    setSelectedEvaluationId(evaluationId);
  };

  const handleStartChallenge = (evaluation: Evaluation, challenge: Challenge) => {
    if (!isChallengeAvailableForStudent(evaluation, challenge)) return;

    setSelectedEvaluationId(null);
    setActionMessage('');
    setFormError('');

    setActiveStudentAttempt({
      evaluationId: evaluation.id,
      challengeId: challenge.id,
      startedAt: Date.now(),
      durationMinutes: evaluation.durationMinutes || 90,
    });

    setStudentSolutionMessages((previous) => ({
      ...previous,
      [challenge.id]: '',
    }));
  };

  const handleStudentSolutionChange = (challengeId: number, value: string) => {
    setStudentSolutions((previous) => ({
      ...previous,
      [challengeId]: value,
    }));

    setStudentSolutionMessages((previous) => ({
      ...previous,
      [challengeId]: '',
    }));
  };

  const handleStudentSubmit = (challengeId: number) => {
    const submittedSolution = studentSolutions[challengeId] || '';

    console.log('Solución enviada por el estudiante:', {
      challengeId,
      solution: submittedSolution,
    });

    setStudentSolutionMessages((previous) => ({
      ...previous,
      [challengeId]: 'Solución enviada correctamente.',
    }));

    setActionMessage('Solución enviada correctamente.');
    setActiveStudentAttempt(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('authUser');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('sqlia_user');
    localStorage.removeItem('role');
    localStorage.removeItem('userRole');

    navigate('/login');
  };

  return (
    <DashboardLayout
      role={storedUser?.role || role}
      userName={storedUser?.fullName || sessionUser.name}
      onLogout={handleLogout}
    >
      <section className="eval-content">
        <div className="eval-page-heading">
          <span className="eval-page-eyebrow">
            {isAdmin
              ? 'RESUMEN ADMINISTRATIVO'
              : isProfessor
                ? 'GESTIÓN ACADÉMICA'
                : 'RETOS SQL PUBLICADOS'}
          </span>

          <h1>
            {isAdmin
              ? 'Información general de evaluaciones y retos'
              : isProfessor
                ? 'Gestión de evaluaciones y retos SQL'
                : 'Resolver retos SQL'}
          </h1>
        </div>

        {actionMessage && (
          <div className="eval-success-banner">{actionMessage}</div>
        )}

        {formError && <div className="eval-warning-banner">{formError}</div>}

        <section
          className={`eval-metrics-grid ${
            !isStudent ? 'eval-metrics-grid-three' : ''
          }`}
        >
          <article className="eval-metric-card">
            <h3>Evaluaciones registradas</h3>
            <strong>{evaluations.length}</strong>
            <p>Total de evaluaciones cargadas en el módulo.</p>
          </article>

          <article className="eval-metric-card">
            <h3>Retos publicados</h3>
            <strong>{publishedChallenges}</strong>
            <p>Retos SQL públicos para estudiantes.</p>
          </article>

          {isStudent && (
            <article className="eval-metric-card eval-date-card">
              <h3>Próximo cierre</h3>
              <strong>{nextClosingDate}</strong>
              <p>Fecha de cierre más próxima.</p>
            </article>
          )}
        </section>

        {isStudent &&
          activeStudentAttempt &&
          activeAttemptEvaluation &&
          activeAttemptChallenge && (
            <div
              className="eval-student-modal-backdrop"
              role="dialog"
              aria-modal="true"
            >
              <section className="eval-student-modal">
                <div className="eval-student-modal-header">
                  <div>
                    <span className="eval-page-eyebrow">RETO INICIADO</span>
                    <h2>{activeAttemptChallenge.title}</h2>
                    <p>{activeAttemptChallenge.description}</p>
                  </div>
                </div>

                <div className="eval-challenge-tags">
                  <span>{activeAttemptChallenge.databaseEngine}</span>
                  <span>
                    Límite ejecución: {activeAttemptChallenge.timeLimitMs} ms
                  </span>
                  <span>
                    {getDifficultyLabel(activeAttemptChallenge.difficulty)}
                  </span>
                  <span>
                    Duración: {activeAttemptEvaluation.durationMinutes || 90}{' '}
                    min
                  </span>
                </div>

                <div
                  className={`eval-attempt-timer ${
                    activeAttemptExpired ? 'expired' : ''
                  }`}
                >
                  <span>Tiempo del reto</span>
                  <strong>
                    {formatAttemptCountdown(activeAttemptRemainingMs)}
                  </strong>
                </div>

                <div className="eval-solution-box">
                  <label>Tu solución SQL</label>

                  <textarea
                    value={studentSolutions[activeAttemptChallenge.id] || ''}
                    onChange={(event) =>
                      handleStudentSolutionChange(
                        activeAttemptChallenge.id,
                        event.target.value,
                      )
                    }
                    placeholder="Escribe aquí tu solución."
                    disabled={activeAttemptExpired}
                  />

                  {activeAttemptExpired && (
                    <span className="eval-error-text">
                      El tiempo del reto terminó.
                    </span>
                  )}

                  <div className="eval-student-modal-actions">
                    <button
                      type="button"
                      className="eval-primary-btn"
                      disabled={activeAttemptExpired}
                      onClick={() =>
                        handleStudentSubmit(activeAttemptChallenge.id)
                      }
                    >
                      Enviar solución
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

        {selectedEvaluation && !isStudent && (
          <section id="eval-detail-panel" className="eval-detail-panel">
            <div className="eval-detail-header">
              <div>
                <span className="eval-page-eyebrow">DETALLE COMPLETO</span>
                <h2>{selectedEvaluation.title}</h2>
                <p>{selectedEvaluation.description}</p>
              </div>

              <button
                type="button"
                className="eval-secondary-btn"
                onClick={() => setSelectedEvaluationId(null)}
              >
                Cerrar
              </button>
            </div>

            <div className="eval-detail-grid">
              <div>
                <strong>Fecha de inicio</strong>
                <span>{formatDate(selectedEvaluation.startDate)}</span>
              </div>

              <div>
                <strong>Fecha de cierre</strong>
                <span>{formatDate(selectedEvaluation.endDate)}</span>
              </div>

              <div>
                <strong>Duración</strong>
                <span>{selectedEvaluation.durationMinutes} minutos</span>
              </div>

              <div>
                <strong>Intentos máximos</strong>
                <span>{selectedEvaluation.maxAttempts}</span>
              </div>
            </div>

            <div className="eval-detail-challenges">
              <h3>Retos SQL de la evaluación</h3>

              {selectedEvaluation.challenges?.length ? (
                selectedEvaluation.challenges.map((challenge) => (
                  <article className="eval-detail-challenge" key={challenge.id}>
                    <div className="eval-challenge-upper-row">
                      <div className="eval-challenge-title-row">
                        <strong>{challenge.title}</strong>

                        <span
                          className={`eval-challenge-status ${challenge.visibility.toLowerCase()}`}
                        >
                          {getChallengeStatusLabel(challenge.visibility)}
                        </span>
                      </div>

                      {isProfessor && (
                        <div className="eval-inline-actions">
                          <button
                            type="button"
                            className="eval-secondary-btn"
                            onClick={() =>
                              handleEditChallenge(selectedEvaluation, challenge)
                            }
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="eval-danger-btn"
                            onClick={() =>
                              handleDeleteChallenge(
                                selectedEvaluation.id,
                                challenge.id,
                              )
                            }
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>

                    <p>{challenge.description}</p>

                    <div className="eval-challenge-tags">
                      <span>{challenge.databaseEngine}</span>
                      <span>Límite ejecución: {challenge.timeLimitMs} ms</span>
                      <span>{getDifficultyLabel(challenge.difficulty)}</span>
                      <span>Puntos: {challenge.points || 0}</span>
                    </div>

                    <div className="eval-sql-preview">
                      <div>
                        <label>Esquema SQL</label>
                        <pre>{challenge.schemaDefinition}</pre>
                      </div>

                      <div>
                        <label>Datos iniciales</label>
                        <pre>{challenge.seedScript}</pre>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="eval-empty-state">
                  Esta evaluación todavía no tiene retos.
                </div>
              )}
            </div>
          </section>
        )}

        <section className="eval-workspace">
          {isProfessor && (
            <div className="eval-form-panel">
              <div className="eval-panel-header compact">
                <div>
                  <h2>
                    {editingEvaluationId
                      ? 'Editar evaluación'
                      : 'Crear evaluación'}
                  </h2>
                  <p>
                    Define la evaluación y luego agrega retos SQL asociados.
                  </p>
                </div>
              </div>

              <div className="eval-form-grid">
                <div className="eval-form-group full">
                  <label>Nombre de la evaluación</label>
                  <input
                    value={evaluationForm.title}
                    onChange={(event) =>
                      handleEvaluationChange('title', event.target.value)
                    }
                    placeholder="Ej: Parcial SQL"
                  />
                </div>

                <div className="eval-form-group full">
                  <label>Descripción</label>
                  <textarea
                    value={evaluationForm.description}
                    onChange={(event) =>
                      handleEvaluationChange('description', event.target.value)
                    }
                    placeholder="Describe la evaluación..."
                  />
                </div>

                <div className="eval-form-group">
                  <label>Fecha de inicio</label>
                  <input
                    type="date"
                    value={evaluationForm.startDate}
                    onChange={(event) =>
                      handleEvaluationChange('startDate', event.target.value)
                    }
                  />
                </div>

                <div className="eval-form-group">
                  <label>Fecha de cierre</label>
                  <input
                    type="date"
                    value={evaluationForm.endDate}
                    onChange={(event) =>
                      handleEvaluationChange('endDate', event.target.value)
                    }
                  />
                </div>

                <div className="eval-form-group">
                  <label>Duración en minutos</label>
                  <input
                    type="number"
                    min={1}
                    value={evaluationForm.durationMinutes}
                    onChange={(event) =>
                      handleEvaluationChange(
                        'durationMinutes',
                        Number(event.target.value),
                      )
                    }
                  />
                </div>

                <div className="eval-form-group">
                  <label>Intentos máximos</label>
                  <input
                    type="number"
                    min={1}
                    value={evaluationForm.maxAttempts}
                    onChange={(event) =>
                      handleEvaluationChange(
                        'maxAttempts',
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
              </div>

              <div className="eval-form-actions">
                <button
                  type="button"
                  className="eval-secondary-btn"
                  onClick={clearEvaluationForm}
                >
                  Limpiar
                </button>

                <button
                  type="button"
                  className="eval-primary-btn"
                  onClick={handleSaveEvaluation}
                >
                  {editingEvaluationId ? 'Guardar cambios' : 'Crear evaluación'}
                </button>
              </div>

              {editingEvaluationId && (
                <div className="eval-subsection eval-challenge-form-card">
                  <div className="eval-panel-header compact">
                    <div>
                      <h3>
                        {editingChallengeId ? 'Editar reto' : 'Agregar reto'}
                      </h3>
                      <p>
                        Los retos agregados aquí quedan asociados a la
                        evaluación seleccionada.
                      </p>
                    </div>
                  </div>

                  <div className="eval-form-grid">
                    <div className="eval-form-group full">
                      <label>Título del reto</label>
                      <input
                        value={challengeForm.title}
                        onChange={(event) =>
                          handleChallengeChange('title', event.target.value)
                        }
                        placeholder="Ej: Consultar clientes por ciudad"
                      />
                    </div>

                    <div className="eval-form-group full">
                      <label>Descripción del reto</label>
                      <textarea
                        value={challengeForm.description}
                        onChange={(event) =>
                          handleChallengeChange(
                            'description',
                            event.target.value,
                          )
                        }
                        placeholder="Describe lo que debe resolver el estudiante..."
                      />
                    </div>

                    <div className="eval-form-group">
                      <label>Dificultad</label>
                      <select
                        value={challengeForm.difficulty}
                        onChange={(event) =>
                          handleChallengeChange(
                            'difficulty',
                            event.target.value as Difficulty,
                          )
                        }
                      >
                        <option value="EASY">Fácil</option>
                        <option value="MEDIUM">Media</option>
                        <option value="HARD">Difícil</option>
                      </select>
                    </div>

                    <div className="eval-form-group">
                      <label>Visibilidad</label>
                      <select
                        value={challengeForm.visibility}
                        onChange={(event) =>
                          handleChallengeChange(
                            'visibility',
                            event.target.value as ChallengeStatus,
                          )
                        }
                      >
                        <option value="PUBLIC">Público</option>
                        <option value="PRIVATE">Privado</option>
                        <option value="ARCHIVED">Archivado</option>
                      </select>
                    </div>

                    <div className="eval-form-group">
                      <label>Motor</label>
                      <input
                        value={challengeForm.databaseEngine}
                        onChange={(event) =>
                          handleChallengeChange(
                            'databaseEngine',
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="eval-form-group">
                      <label>Límite ejecución ms</label>
                      <input
                        type="number"
                        min={500}
                        value={challengeForm.timeLimitMs}
                        onChange={(event) =>
                          handleChallengeChange(
                            'timeLimitMs',
                            Number(event.target.value),
                          )
                        }
                      />
                    </div>

                    <div className="eval-form-group">
                      <label>Puntos</label>
                      <input
                        type="number"
                        min={1}
                        value={challengeForm.points}
                        onChange={(event) =>
                          handleChallengeChange(
                            'points',
                            Number(event.target.value),
                          )
                        }
                      />
                    </div>

                    <div className="eval-form-group full">
                      <label>Esquema SQL</label>
                      <textarea
                        className="eval-code-textarea"
                        value={challengeForm.schemaDefinition}
                        onChange={(event) =>
                          handleChallengeChange(
                            'schemaDefinition',
                            event.target.value,
                          )
                        }
                      />
                    </div>

                    <div className="eval-form-group full">
                      <label>Datos iniciales</label>
                      <textarea
                        className="eval-code-textarea"
                        value={challengeForm.seedScript}
                        onChange={(event) =>
                          handleChallengeChange('seedScript', event.target.value)
                        }
                      />
                    </div>

                    <div className="eval-form-group full">
                      <label>Resultado esperado</label>
                      <textarea
                        className="eval-code-textarea"
                        value={
                          typeof challengeForm.expectedResult === 'string'
                            ? challengeForm.expectedResult
                            : JSON.stringify(
                                challengeForm.expectedResult || '',
                                null,
                                2,
                              )
                        }
                        onChange={(event) =>
                          handleChallengeChange(
                            'expectedResult',
                            event.target.value,
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="eval-form-actions">
                    <button
                      type="button"
                      className="eval-secondary-btn"
                      onClick={() => {
                        setChallengeForm(emptyChallenge);
                        setEditingChallengeId(null);
                      }}
                    >
                      Limpiar reto
                    </button>

                    <button
                      type="button"
                      className="eval-primary-btn"
                      onClick={handleSaveChallenge}
                    >
                      {editingChallengeId ? 'Guardar reto' : 'Agregar reto'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div
            className={`eval-list-panel ${!isProfessor ? 'full-width' : ''}`}
          >
            <div className="eval-panel-header">
              <div>
                <h2>
                  {isAdmin
                    ? 'Vista general de evaluaciones y retos'
                    : isProfessor
                      ? 'Evaluaciones registradas'
                      : 'Retos SQL disponibles'}
                </h2>
              </div>
            </div>

            <div className="eval-list-tools">
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setSelectedEvaluationId(null);
                }}
                placeholder="Buscar evaluación por nombre o curso..."
              />

              {isStudent && (
                <select
                  value={studentFilter}
                  onChange={(event) => {
                    setStudentFilter(
                      event.target.value as StudentEvaluationFilter,
                    );
                    setSelectedEvaluationId(null);
                  }}
                >
                  <option value="AVAILABLE">Retos disponibles</option>
                  <option value="UNAVAILABLE">Retos no disponibles</option>
                  <option value="ALL">Todos</option>
                </select>
              )}
            </div>

            <div className="eval-cards-list">
              {filteredEvaluations.length === 0 && (
                <div className="eval-empty-state">
                  No se encontraron evaluaciones.
                </div>
              )}

              {filteredEvaluations.map((evaluation) => (
                <article className="eval-card" key={evaluation.id}>
                  <div className="eval-card-header">
                    <div>
                      <h3>{evaluation.title}</h3>
                      <p>{evaluation.description}</p>
                    </div>

                    {!isStudent && (
                      <span
                        className={`eval-status-badge ${
                          evaluation.status === 'ACTIVE' ? 'active' : 'inactive'
                        }`}
                      >
                        {getStatusLabel(evaluation.status)}
                      </span>
                    )}
                  </div>

                  <div className="eval-card-dates">
                    <span>Inicio: {formatDate(evaluation.startDate)}</span>
                    <span>Cierre: {formatDate(evaluation.endDate)}</span>
                    <span>Duración: {evaluation.durationMinutes || 90} min</span>
                    <span>Intentos: {evaluation.maxAttempts}</span>
                    <span>Retos: {evaluation.challenges?.length || 0}</span>
                  </div>

                  <div className="eval-card-summary">
                    {evaluation.challenges?.length ? (
                      evaluation.challenges.map((challenge) => {
                        const canSubmit = isChallengeAvailableForStudent(
                          evaluation,
                          challenge,
                        );

                        return (
                          <div
                            className={`eval-card-summary-row ${
                              isStudent ? 'student-row' : ''
                            }`}
                            key={challenge.id}
                          >
                            <strong>{challenge.title}</strong>

                            <span>
                              {getDifficultyLabel(challenge.difficulty)}
                            </span>

                            {isStudent ? (
                              <>
                                <span className="eval-duration-label">
                                  Duración: {evaluation.durationMinutes || 90}{' '}
                                  min
                                </span>

                                <button
                                  type="button"
                                  className="eval-primary-btn eval-start-challenge-btn"
                                  disabled={!canSubmit}
                                  onClick={() =>
                                    handleStartChallenge(evaluation, challenge)
                                  }
                                >
                                  {canSubmit ? 'Iniciar reto' : 'No disponible'}
                                </button>
                              </>
                            ) : (
                              <>
                                <span
                                  className={
                                    challenge.visibility === 'PUBLIC'
                                      ? 'eval-mini-available'
                                      : 'eval-mini-unavailable'
                                  }
                                >
                                  {getChallengeStatusLabel(challenge.visibility)}
                                </span>

                                <button
                                  type="button"
                                  className="eval-secondary-btn eval-small-btn"
                                  onClick={() =>
                                    handleEditChallenge(evaluation, challenge)
                                  }
                                >
                                  Editar reto
                                </button>
                              </>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="eval-empty-state">
                        Esta evaluación no tiene retos asociados.
                      </div>
                    )}
                  </div>

                  <div className="eval-card-actions">
                    {!isStudent && (
                      <>
                        <button
                          type="button"
                          className="eval-primary-btn"
                          onClick={() => handleOpenDetail(evaluation.id)}
                        >
                          Ver detalle
                        </button>

                        {isProfessor && (
                          <>
                            <button
                              type="button"
                              className="eval-secondary-btn"
                              onClick={() => handleEditEvaluation(evaluation)}
                            >
                              Editar
                            </button>

                            <button
                              type="button"
                              className="eval-danger-btn"
                              onClick={() =>
                                handleDeleteEvaluation(evaluation.id)
                              }
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </section>
    </DashboardLayout>
  );
}