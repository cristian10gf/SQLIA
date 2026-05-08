import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type {
  Challenge,
  ChallengeFormErrors,
  ChallengeStatus,
  Difficulty,
  Evaluation,
  EvaluationFormErrors,
  EvaluationStatus,
  StudentSolutionErrors,
} from '../../domain/evaluationChallenge.types';
import '../styles/EvaluationsAndChallengesPage.css';
import { evaluationApi } from '../../infrastructure/evaluationApi';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import { challengeApi } from '../../infrastructure/challengeApi';
import { evaluationChallengeApi } from '../../infrastructure/evaluationChallengeApi';

type UserRole = 'ADMIN' | 'PROFESSOR' | 'STUDENT';
type StudentEvaluationFilter = 'AVAILABLE' | 'UNAVAILABLE' | 'ALL';

interface SessionUser {
  name: string;
  role: UserRole;
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

function normalizeRole(value?: string | null): UserRole {
  const normalizedValue = value?.toUpperCase();

  if (normalizedValue === 'PROFESSOR' || normalizedValue === 'PROFESOR') {
    return 'PROFESSOR';
  }

  if (normalizedValue === 'STUDENT' || normalizedValue === 'ESTUDIANTE') {
    return 'STUDENT';
  }

  return 'ADMIN';
}

function getSessionUser(): SessionUser {
  const possibleUserKeys = ['user', 'authUser', 'currentUser', 'sqlia_user'];

  for (const key of possibleUserKeys) {
    const rawUser = localStorage.getItem(key);

    if (!rawUser) continue;

    try {
      const parsedUser = JSON.parse(rawUser);

      return {
        name:
          parsedUser.name ||
          parsedUser.fullName ||
          parsedUser.username ||
          parsedUser.email ||
          'administrador prueba',
        role: normalizeRole(parsedUser.role),
      };
    } catch {
      continue;
    }
  }

  return {
    name: localStorage.getItem('name') || 'administrador prueba',
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

function getChallengeStatusLabel(status: ChallengeStatus) {
  if (status === 'PUBLIC') return 'Público';
  if (status === 'PRIVATE') return 'Privado';
  return 'Archivado';
}

function isChallengeAvailableForStudent(
  evaluation: Evaluation,
  challenge: Challenge,
) {
  const now = new Date();
  const start = new Date(evaluation.startDate);
  const end = new Date(evaluation.endDate);
  const isEvaluationOpen = now >= start && now <= end;

  return isEvaluationOpen && challenge.visibility === 'PUBLIC';
}
export default function EvaluationsAndChallengesPage() {
  const { courseId } = useParams<{ courseId: string }>();

  const [session] = useState(() => ({
    token: authStorage.getToken(),
    user: authStorage.getUser(),
  }));

  const token = session.token;
  const user = session.user;

  const navigate = useNavigate();

  const sessionUser = getSessionUser();
  const [role] = useState<UserRole>(sessionUser.role);

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const loadData = async () => {
    if (!courseId || !token || !role) return;

    try {
      const response: any =
        role === 'PROFESSOR'
          ? await evaluationApi.listForProfessor(courseId, { limit: 10 }, token)
          : await evaluationApi.listVisibleForStudent(courseId, 1, 10, token);

      const rawData = response?.data || response;
      const evaluationsData = Array.isArray(rawData) ? rawData : [];

      const enrichedEvaluations = await Promise.all(
        evaluationsData.map(async (ev: Evaluation) => {
          try {
            const challengesRes: any =
              role === 'PROFESSOR'
                ? await evaluationChallengeApi.listByEvaluation(
                    ev.id.toString(),
                    {},
                    token,
                  )
                : await evaluationChallengeApi.listByEvaluationForStudent(
                    ev.id.toString(),
                    token,
                  );
            return { ...ev, challenges: challengesRes.data || [] };
          } catch {
            return { ...ev, challenges: [] };
          }
        }),
      );

      setEvaluations(enrichedEvaluations);
    } catch (error) {
      console.error('Error al cargar evaluaciones:', error);
      setEvaluations([]);
      setActionMessage('Error al cargar las evaluaciones.');
    }
  };

  useEffect(() => {
    loadData();
  }, [courseId, token, role]);

  const [evaluationForm, setEvaluationForm] =
    useState<Omit<Evaluation, 'id'>>(emptyEvaluation);

  const [challengeForm, setChallengeForm] =
    useState<Omit<Challenge, 'id'>>(emptyChallenge);

  const [evaluationErrors, setEvaluationErrors] =
    useState<EvaluationFormErrors>({});

  const [challengeErrors, setChallengeErrors] = useState<ChallengeFormErrors>(
    {},
  );

  const [studentSolutions, setStudentSolutions] = useState<
    Record<number, string>
  >({});

  const [studentSolutionErrors, setStudentSolutionErrors] = useState<
    Record<number, StudentSolutionErrors>
  >({});

  const [studentSolutionMessages, setStudentSolutionMessages] = useState<
    Record<number, string>
  >({});

  const [editingEvaluationId, setEditingEvaluationId] = useState<number | null>(
    null,
  );

  const [selectedEvaluationId, setSelectedEvaluationId] = useState<
    number | null
  >(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [studentFilter, setStudentFilter] =
    useState<StudentEvaluationFilter>('AVAILABLE');

  const [actionMessage, setActionMessage] = useState('');

  const isAdmin = role === 'ADMIN';
  const isProfessor = role === 'PROFESSOR';
  const isStudent = role === 'STUDENT';

  const visibleEvaluations = useMemo(() => {
    if (!isStudent) {
      return evaluations;
    }

    if (studentFilter === 'AVAILABLE') {
      return evaluations
        .filter((evaluation) => evaluation.status === 'ACTIVE')
        .map((evaluation) => ({
          ...evaluation,
          challenges: evaluation.challenges?.filter(
            (challenge) => challenge.visibility === 'PUBLIC',
          ),
        }))
        .filter((evaluation) => evaluation.challenges.length > 0);
    }

    if (studentFilter === 'UNAVAILABLE') {
      return evaluations
        .map((evaluation) => {
          const challenges = evaluation.challenges || [];
          const unavailableChallenges =
            evaluation.status !== 'ACTIVE'
              ? challenges
              : challenges.filter(
                  (challenge) => challenge.visibility !== 'PUBLIC',
                );

          return {
            ...evaluation,
            challenges: unavailableChallenges,
          };
        })
        .filter((evaluation) => (evaluation.challenges?.length || 0) > 0);
    }

    return evaluations;
  }, [evaluations, isStudent, studentFilter]);

  const filteredEvaluations = useMemo(() => {
    // 1. Si es profesor, no filtramos nada
    if (role === 'PROFESSOR') return evaluations;

    // 2. Si es estudiante, aplicamos lógica según el selector
    return evaluations.filter((ev) => {
      // Si el filtro es ALL, confiamos en lo que mandó la API y mostramos todo
      if (studentFilter === 'ALL') return true;

      const now = new Date();
      const start = new Date(ev.startDate);
      const end = new Date(ev.endDate);
      const isAvailable = now >= start && now <= end;

      if (studentFilter === 'AVAILABLE') return isAvailable;
      if (studentFilter === 'UNAVAILABLE') return !isAvailable;

      return true;
    });
  }, [evaluations, studentFilter, role]);

  const selectedEvaluation = useMemo(() => {
    if (!selectedEvaluationId) return null;

    return (
      evaluations.find(
        (evaluation) => evaluation.id === selectedEvaluationId,
      ) || null
    );
  }, [selectedEvaluationId, visibleEvaluations]);

  const publishedChallenges = useMemo(() => {
    return evaluations.reduce((accumulator, evaluation) => {
      return (
        accumulator +
        (evaluation.challenges?.filter(
          (challenge) => challenge.visibility === 'PUBLIC',
        ).length || 0)
      );
    }, 0);
  }, [evaluations]);

  const activeEvaluations = useMemo(() => {
    return evaluations.filter((evaluation) => evaluation.status === 'ACTIVE')
      .length;
  }, [evaluations]);

  const nextClosingDate = useMemo(() => {
    const active = evaluations.filter(
      (evaluation) => evaluation.status === 'ACTIVE',
    );

    if (active.length === 0) return 'Sin fecha';

    const ordered = [...active].sort((a, b) =>
      a.endDate.localeCompare(b.endDate),
    );

    return ordered[0].endDate;
  }, [evaluations]);

  const validateEvaluation = (
    evaluation: Omit<Evaluation, 'id'>,
  ): EvaluationFormErrors => {
    const errors: EvaluationFormErrors = {};

    if (!evaluation.title.trim()) {
      errors.title = 'El nombre de la evaluación es obligatorio.';
    } else if (evaluation.title.trim().length < 4) {
      errors.title = 'El nombre debe tener mínimo 4 caracteres.';
    }

    if (!evaluation.description.trim()) {
      errors.description = 'La descripción es obligatoria.';
    } else if (evaluation.description.trim().length < 10) {
      errors.description = 'La descripción debe tener mínimo 10 caracteres.';
    }

    if (!evaluation.startDate) {
      errors.startDate = 'La fecha de inicio es obligatoria.';
    }

    if (!evaluation.endDate) {
      errors.endDate = 'La fecha de cierre es obligatoria.';
    }

    if (evaluation.startDate && evaluation.endDate) {
      const start = new Date(evaluation.startDate);
      const end = new Date(evaluation.endDate);

      if (end < start) {
        errors.endDate =
          'La fecha de cierre no puede ser anterior a la fecha de inicio.';
      }
    }

    if (!evaluation.durationMinutes || evaluation.durationMinutes < 1) {
      errors.durationMinutes = 'La duración debe ser mayor a 0 minutos.';
    }

    if (!evaluation.maxAttempts || evaluation.maxAttempts < 1) {
      errors.maxAttempts = 'Los intentos máximos deben ser mínimo 1.';
    }

    return errors;
  };

  const validateChallenge = (
    challenge: Omit<Challenge, 'id'>,
  ): ChallengeFormErrors => {
    const errors: ChallengeFormErrors = {};

    if (!challenge.title.trim()) {
      errors.title = 'El título del reto es obligatorio.';
    } else if (challenge.title.trim().length < 4) {
      errors.title = 'El título debe tener mínimo 4 caracteres.';
    }

    if (!challenge.description.trim()) {
      errors.description = 'La descripción del reto es obligatoria.';
    } else if (challenge.description.trim().length < 10) {
      errors.description = 'La descripción debe tener mínimo 10 caracteres.';
    }

    if (!challenge.points || challenge.points < 1) {
      errors.points = 'Los puntos deben ser mayores o iguales a 1.';
    } else if (challenge.points > 100) {
      errors.points = 'Los puntos no pueden superar 100.';
    }

    if (!challenge.databaseEngine.trim()) {
      errors.databaseEngine = 'El motor de base de datos es obligatorio.';
    }

    if (!challenge.timeLimitMs || challenge.timeLimitMs < 500) {
      errors.timeLimitMs = 'El límite de tiempo debe ser mínimo 500 ms.';
    }

    if (!challenge.schemaDefinition.trim()) {
      errors.schemaDefinition = 'El esquema SQL es obligatorio.';
    } else if (
      !challenge.schemaDefinition.toUpperCase().includes('CREATE TABLE')
    ) {
      errors.schemaDefinition =
        'El esquema debe incluir al menos una sentencia CREATE TABLE.';
    }

    if (!challenge.seedScript.trim()) {
      errors.seedScript = 'Los datos iniciales son obligatorios.';
    } else if (!challenge.seedScript.toUpperCase().includes('INSERT INTO')) {
      errors.seedScript =
        'Los datos iniciales deben incluir al menos una sentencia INSERT INTO.';
    }

    const result = challenge.expectedResult;

    if (!result || (typeof result === 'string' && !result.trim())) {
      errors.expectedResult = 'El resultado esperado es obligatorio.';
    } else if (typeof result === 'string') {
      try {
        JSON.parse(result);
      } catch (e) {
        errors.expectedResult =
          'El formato JSON es inválido. Revisa las comas y comillas.';
      }
    }
    return errors;
  };

  const validateStudentSolution = (query: string): StudentSolutionErrors => {
    const errors: StudentSolutionErrors = {};

    if (!query.trim()) {
      errors.query = 'Debes escribir una solución SQL antes de enviarla.';
    } else if (query.trim().length < 10) {
      errors.query = 'La consulta SQL es demasiado corta.';
    } else if (!query.trim().toUpperCase().startsWith('SELECT')) {
      errors.query = 'Para este demo, la solución debe iniciar con SELECT.';
    }

    return errors;
  };

  const handleEvaluationChange = (
    field: keyof Omit<Evaluation, 'id' | 'challenges'>,
    value: string | number | EvaluationStatus,
  ) => {
    const updatedForm = {
      ...evaluationForm,
      [field]: value,
    };

    setEvaluationForm(updatedForm);
    setEvaluationErrors(validateEvaluation(updatedForm));
    setActionMessage('');
  };

  const handleChallengeChange = (
    field: keyof Omit<Challenge, 'id'>,
    value: string | number | Difficulty | ChallengeStatus,
  ) => {
    const updatedForm = {
      ...challengeForm,
      [field]: value,
    };

    setChallengeForm(updatedForm);
    setChallengeErrors(validateChallenge(updatedForm));
    setActionMessage('');
  };

  const addChallenge = async () => {
    const errors = validateChallenge(challengeForm);
    setChallengeErrors(errors);
    setActionMessage('');

    if (Object.keys(errors).length > 0) return;

    if (!editingEvaluationId) {
      setActionMessage(
        'Error: No hay una evaluación seleccionada para editar.',
      );
      return;
    }

    try {
      let finalExpectedResult = challengeForm.expectedResult;

      if (typeof finalExpectedResult === 'string') {
        try {
          const parsed = JSON.parse(finalExpectedResult);

          if (
            parsed &&
            typeof parsed === 'object' &&
            !Array.isArray(parsed) &&
            parsed.data
          ) {
            finalExpectedResult = parsed;
          } else if (Array.isArray(parsed)) {
            finalExpectedResult = {
              data: parsed,
              rowCount: parsed.length,
            };
          } else {
            finalExpectedResult = parsed;
          }
        } catch (e) {
          setChallengeErrors({ ...errors, expectedResult: 'JSON inválido' });
          return;
        }
      }

      const { points, ...challengeData } = challengeForm;

      const challengePayload = {
        ...challengeData,
        expectedResult: finalExpectedResult,
        courseId: courseId,
        timeLimitMs: Number(challengeForm.timeLimitMs),
      };

      if (editingChallengeId) {
        await challengeApi.update(
          editingChallengeId.toString(),
          challengePayload,
          token!,
        );

        await evaluationChallengeApi.updateAssociation(
          editingEvaluationId!.toString(),
          editingChallengeId.toString(),
          { points: Number(points) },
          token!,
        );

        setEvaluationForm((prev) => ({
          ...prev,
          challenges: prev.challenges.map((ch) =>
            ch.id === editingChallengeId
              ? { ...ch, ...challengePayload, points: Number(points) }
              : ch,
          ),
        }));
        setActionMessage('Reto actualizado correctamente');
      } else {
        console.log('TIPO DE DATO:', typeof challengePayload.expectedResult);
        console.log('CONTENIDO:', challengePayload.expectedResult);
        const challengeRes: any = await challengeApi.create(
          challengePayload,
          token!,
        );
        const newChallenge = challengeRes.data;

        await evaluationChallengeApi.associate(
          {
            evaluationId: editingEvaluationId.toString(),
            challengeId: newChallenge.id,
            points: Number(points),
            orderIndex: evaluationForm.challenges.length + 1,
          },
          token!,
        );

        const challengeWithPoints = { ...newChallenge, points: Number(points) };

        setEvaluationForm({
          ...evaluationForm,
          challenges: [...evaluationForm.challenges, challengeWithPoints],
        });

        setChallengeForm(emptyChallenge);
        setChallengeErrors({});
        setActionMessage('Reto agregado correctamente a la evaluación.');
      }

      await loadData();
    } catch (error: any) {
      console.error('Error al agregar reto:', error);
      setActionMessage(
        error.response?.data?.message || 'Error al crear el reto.',
      );
    }
  };

  const removeChallenge = async (challengeId: number) => {
    if (!selectedEvaluationId) return;

    const confirmDelete = window.confirm(
      '¿Estás seguro de que deseas eliminar este reto?',
    );

    if (!confirmDelete) return;

    try {
      setActionMessage('Eliminando reto...');

      await evaluationChallengeApi.removeAssociation(
        selectedEvaluationId.toString(),
        challengeId.toString(),
        token!,
      );

      await challengeApi.remove(challengeId.toString(), token!);

      const updatedChallenges = evaluationForm.challenges.filter(
        (ch) => ch.id !== challengeId,
      );

      setEvaluationForm({
        ...evaluationForm,
        challenges: updatedChallenges,
      });

      setActionMessage('Reto eliminado correctamente.');

      loadData();
    } catch (error: any) {
      console.error('Error al eliminar el reto:', error);
      setActionMessage(
        error.response?.data?.message ||
          'No se pudo eliminar el reto completamente.',
      );
    }
  };

  const clearForm = () => {
    setEvaluationForm(emptyEvaluation);
    setChallengeForm(emptyChallenge);
    setEvaluationErrors({});
    setChallengeErrors({});
    setEditingEvaluationId(null);
    setActionMessage('');
  };

  const handleSubmit = async () => {
    const errors = validateEvaluation(evaluationForm);
    setEvaluationErrors(errors);
    setActionMessage('');

    if (Object.keys(errors).length > 0) return;

    try {
      const { status, courseName, challenges, ...evaluationData } =
        evaluationForm;

      const payload = {
        ...evaluationData,
        courseId: courseId,
      };

      if (editingEvaluationId) {
        await evaluationApi.update(
          editingEvaluationId.toString(),
          payload,
          token!,
        );
        setActionMessage(
          'Evaluación actualizada correctamente en el servidor.',
        );
      } else {
        await evaluationApi.create(payload, token!);
        setActionMessage('Evaluación creada y persistida correctamente.');
      }

      await loadData();
      clearForm();
    } catch (error: any) {
      console.error('Error al guardar evaluación:', error);
      setActionMessage('Error al guardar la evaluación.');
    }
  };

  const handleEdit = (evaluation: Evaluation) => {
    setEditingEvaluationId(evaluation.id);

    setEvaluationForm({
      title: evaluation.title,
      description: evaluation.description,
      startDate: evaluation.startDate.split('T')[0],
      endDate: evaluation.endDate.split('T')[0],
      status: evaluation.status,
      durationMinutes: evaluation.durationMinutes || 60,
      maxAttempts: evaluation.maxAttempts || 1,
      courseName: evaluation.courseName || '',
      challenges: evaluation.challenges || [],
    });

    const formElement = document.querySelector('.eval-form-panel');

    setTimeout(() => {
      formElement?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleDelete = async (id: string) => {
    // 1. Confirmación del usuario
    const confirmDelete = window.confirm(
      '¿Seguro que deseas eliminar esta evaluación? Esta acción no se puede deshacer.',
    );

    if (!confirmDelete) return;

    try {
      // 2. Llamada a la API
      // Asegúrate de pasar el token que ya tienes disponible en el componente
      await evaluationApi.remove(id, token!);

      // 3. Actualización del estado local (Optimistic UI o Sync)
      setEvaluations((previous) =>
        previous.filter((evaluation) => evaluation.id.toString() !== id),
      );

      if (editingEvaluationId?.toString() === id) {
        setEditingEvaluationId(null);
        clearForm();
      }

      if (selectedEvaluationId?.toString() === id) {
        setSelectedEvaluationId(null);
      }

      setActionMessage('Evaluación eliminada correctamente del servidor.');
      await loadData();
    } catch (error: any) {
      console.error('Error al eliminar la evaluación:', error);

      // Feedback de error
      const errorMsg =
        error.response?.data?.message || 'No se pudo eliminar la evaluación.';
      setActionMessage(`Error: ${errorMsg}`);

      // Si la API falló, podrías recargar los datos para restaurar la lista
      await loadData();
    }
  };
  const handleOpenDetail = (evaluationId: number) => {
    setEditingChallengeId(null);
    setSelectedEvaluationId(evaluationId);

    setTimeout(() => {
      document.getElementById('eval-detail-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 50);
  };

  const [editingChallengeId, setEditingChallengeId] = useState<number | null>(
    null,
  );

  const handleEditChallenge = (
    evaluation: Evaluation,
    challenge: Challenge,
  ) => {
    setEditingEvaluationId(evaluation.id);
    setEditingChallengeId(challenge.id);

    setEvaluationForm({
      title: evaluation.title,
      description: evaluation.description,
      startDate: evaluation.startDate.split('T')[0],
      endDate: evaluation.endDate.split('T')[0],
      status: evaluation.status,
      durationMinutes: evaluation.durationMinutes || 60,
      maxAttempts: evaluation.maxAttempts || 1,
      courseName: evaluation.courseName || '',
      challenges: evaluation.challenges || [],
    });
    setChallengeForm({
      title: challenge.title,
      description: challenge.description,
      difficulty: challenge.difficulty,
      databaseEngine: challenge.databaseEngine,
      visibility: challenge.visibility,
      schemaDefinition: challenge.schemaDefinition,
      seedScript: challenge.seedScript,
      expectedResult: challenge.expectedResult,
      timeLimitMs: challenge.timeLimitMs,
      points: (challenge as any).points || 0,
    });

    setTimeout(() => {
      const formElement = document.querySelector('.eval-challenge-form-card');

      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: 'smooth',
        });
      }
    }, 100);
  };

  const handleStudentSolutionChange = (challengeId: number, query: string) => {
    setStudentSolutions((previous) => ({
      ...previous,
      [challengeId]: query,
    }));

    setStudentSolutionErrors((previous) => ({
      ...previous,
      [challengeId]: validateStudentSolution(query),
    }));

    setStudentSolutionMessages((previous) => ({
      ...previous,
      [challengeId]: '',
    }));
  };

  const handleStudentSubmit = (challengeId: number) => {
    const query = studentSolutions[challengeId] || '';
    const errors = validateStudentSolution(query);

    setStudentSolutionErrors((previous) => ({
      ...previous,
      [challengeId]: errors,
    }));

    if (Object.keys(errors).length > 0) return;

    setStudentSolutionMessages((previous) => ({
      ...previous,
      [challengeId]:
        'Solución enviada visualmente. Cuando se conecte el backend, aquí se registrará el submission.',
    }));
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
      role={user!.role}
      userName={user!.fullName}
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

        <section
          className={`eval-metrics-grid ${
            !isStudent ? 'eval-metrics-grid-three' : ''
          }`}
        >
          <article className="eval-metric-card">
            <h3>Evaluaciones registradas</h3>
            <strong>{evaluations.length}</strong>
            <p>
              {isAdmin
                ? 'Consulta general de la plataforma.'
                : 'Total de evaluaciones del módulo.'}
            </p>
          </article>

          <article className="eval-metric-card">
            <h3>Retos publicados</h3>
            <strong>{publishedChallenges}</strong>
            <p>Retos SQL disponibles para estudiantes.</p>
          </article>

          {isStudent && (
            <article className="eval-metric-card eval-date-card">
              <h3>Próximo cierre</h3>
              <strong>{nextClosingDate}</strong>
              <p>Fecha más próxima entre las evaluaciones activas.</p>
            </article>
          )}
        </section>

        {selectedEvaluation && (
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
                Cerrar detalle
              </button>
            </div>

            <div className="eval-detail-grid">
              <div>
                <strong>Fecha de inicio</strong>
                <span>
                  {new Date(selectedEvaluation.startDate).toLocaleDateString()}
                </span>
              </div>

              <div>
                <strong>Fecha de cierre</strong>
                <span>
                  {new Date(selectedEvaluation.endDate).toLocaleDateString()}
                </span>
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
              {Array.isArray(selectedEvaluation?.challenges) &&
              selectedEvaluation.challenges.length > 0 ? (
                <h3>Retos SQL de la evaluación</h3>
              ) : null}

              {selectedEvaluation?.challenges?.map((challenge) => {
                const canSubmit = isChallengeAvailableForStudent(
                  selectedEvaluation,
                  challenge,
                );

                return (
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

                      {role === 'PROFESSOR' && (
                        <div>
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
                            onClick={() => removeChallenge(challenge.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      )}
                    </div>

                    <p>{challenge.description}</p>

                    <div className="eval-challenge-tags">
                      <span>{challenge.databaseEngine}</span>
                      <span>{challenge.timeLimitMs} ms</span>
                      <span>{getDifficultyLabel(challenge.difficulty)}</span>
                    </div>

                    {!isStudent && (
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
                    )}

                    {isStudent && canSubmit && (
                      <div className="eval-solution-box">
                        <label>Tu solución SQL</label>
                        <textarea
                          value={studentSolutions[challenge.id] || ''}
                          onChange={(event) =>
                            handleStudentSolutionChange(
                              challenge.id,
                              event.target.value,
                            )
                          }
                          placeholder="SELECT c.name FROM customers c;"
                        />

                        {studentSolutionErrors[challenge.id]?.query && (
                          <span className="eval-error-text">
                            {studentSolutionErrors[challenge.id]?.query}
                          </span>
                        )}

                        {studentSolutionMessages[challenge.id] && (
                          <span className="eval-success-text">
                            {studentSolutionMessages[challenge.id]}
                          </span>
                        )}

                        <button
                          type="button"
                          className="eval-primary-btn"
                          onClick={() => handleStudentSubmit(challenge.id)}
                        >
                          Enviar solución
                        </button>
                      </div>
                    )}

                    {isStudent && !canSubmit && (
                      <div className="eval-unavailable-box">
                        Este reto no está disponible para envío. Puedes
                        consultarlo, pero no enviar solución.
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="eval-workspace">
          {isProfessor && (
            <div className="eval-form-panel">
              <div className="eval-panel-header">
                <div>
                  <h2>
                    {editingEvaluationId
                      ? 'Editar evaluación'
                      : 'Crear evaluación'}
                  </h2>
                  <p>Completa la evaluación y agrega uno o varios retos SQL.</p>
                </div>

                {editingEvaluationId && (
                  <button
                    type="button"
                    className="eval-secondary-btn"
                    onClick={clearForm}
                  >
                    Cancelar
                  </button>
                )}
              </div>

              <div className="eval-form-grid">
                <div className="eval-form-group full">
                  <label>Nombre de la evaluación</label>
                  <input
                    type="text"
                    value={evaluationForm.title}
                    onChange={(event) =>
                      handleEvaluationChange('title', event.target.value)
                    }
                    placeholder="Ej: Parcial 1 - SQL avanzado"
                  />
                  {evaluationErrors.title && (
                    <span className="eval-error-text">
                      {evaluationErrors.title}
                    </span>
                  )}
                </div>

                <div className="eval-form-group full">
                  <label>Descripción</label>
                  <textarea
                    value={evaluationForm.description}
                    onChange={(event) =>
                      handleEvaluationChange('description', event.target.value)
                    }
                    placeholder="Describe el objetivo de la evaluación"
                  />
                  {evaluationErrors.description && (
                    <span className="eval-error-text">
                      {evaluationErrors.description}
                    </span>
                  )}
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
                  {evaluationErrors.startDate && (
                    <span className="eval-error-text">
                      {evaluationErrors.startDate}
                    </span>
                  )}
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
                  {evaluationErrors.endDate && (
                    <span className="eval-error-text">
                      {evaluationErrors.endDate}
                    </span>
                  )}
                </div>

                <div className="eval-form-group">
                  <label>Duración en minutos</label>
                  <input
                    type="number"
                    min="1"
                    value={evaluationForm.durationMinutes}
                    onChange={(event) =>
                      handleEvaluationChange(
                        'durationMinutes',
                        Number(event.target.value),
                      )
                    }
                  />
                  {evaluationErrors.durationMinutes && (
                    <span className="eval-error-text">
                      {evaluationErrors.durationMinutes}
                    </span>
                  )}
                </div>

                <div className="eval-form-group">
                  <label>Intentos máximos</label>
                  <input
                    type="number"
                    min="1"
                    value={evaluationForm.maxAttempts}
                    onChange={(event) =>
                      handleEvaluationChange(
                        'maxAttempts',
                        Number(event.target.value),
                      )
                    }
                  />
                  {evaluationErrors.maxAttempts && (
                    <span className="eval-error-text">
                      {evaluationErrors.maxAttempts}
                    </span>
                  )}
                </div>

                <div className="eval-form-group"></div>
                <div className="eval-form-actions">
                  <button
                    type="button"
                    className="eval-primary-btn"
                    onClick={handleSubmit}
                  >
                    {editingEvaluationId
                      ? 'Actualizar evaluación'
                      : 'Crear evaluación'}
                  </button>
                </div>
              </div>
              {editingEvaluationId && (
                <>
                  <div className="eval-subsection">
                    <div className="eval-panel-header compact">
                      <div>
                        <h3>Agregar reto SQL</h3>
                        <p>
                          Define el problema, el esquema de base de datos y los
                          datos iniciales de prueba.
                        </p>
                      </div>
                    </div>

                    <div className="eval-form-grid">
                      <div className="eval-form-group">
                        <label>Título del reto</label>
                        <input
                          type="text"
                          value={challengeForm.title}
                          onChange={(event) =>
                            handleChallengeChange('title', event.target.value)
                          }
                          placeholder="Ej: Clientes con más de tres compras"
                        />
                        {challengeErrors.title && (
                          <span className="eval-error-text">
                            {challengeErrors.title}
                          </span>
                        )}
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
                        <label>Motor</label>
                        <select
                          value={challengeForm.databaseEngine}
                          onChange={(event) =>
                            handleChallengeChange(
                              'databaseEngine',
                              event.target.value,
                            )
                          }
                        >
                          <option value="PostgreSQL">PostgreSQL</option>
                          <option value="MySQL">MySQL</option>
                          <option value="SQLite">SQLite</option>
                        </select>
                      </div>

                      <div className="eval-form-group">
                        <label>Estado del reto</label>
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
                        </select>
                      </div>

                      <div className="eval-form-group">
                        <label>Puntos</label>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={challengeForm.points}
                          onChange={(event) =>
                            handleChallengeChange(
                              'points',
                              Number(event.target.value),
                            )
                          }
                        />
                        {challengeErrors.points && (
                          <span className="eval-error-text">
                            {challengeErrors.points}
                          </span>
                        )}
                      </div>

                      <div className="eval-form-group">
                        <label>Límite de tiempo (ms)</label>
                        <input
                          type="number"
                          min="500"
                          value={challengeForm.timeLimitMs}
                          onChange={(event) =>
                            handleChallengeChange(
                              'timeLimitMs',
                              Number(event.target.value),
                            )
                          }
                        />
                        {challengeErrors.timeLimitMs && (
                          <span className="eval-error-text">
                            {challengeErrors.timeLimitMs}
                          </span>
                        )}
                      </div>

                      <div className="eval-form-group full">
                        <label>Resultado esperado (JSON)</label>
                        <textarea
                          className={
                            challengeErrors.expectedResult
                              ? 'eval-input-error'
                              : ''
                          }
                          rows={5}
                          value={
                            // Si es string, lo usamos tal cual
                            typeof challengeForm.expectedResult === 'string'
                              ? challengeForm.expectedResult
                              : // Si no es string pero tiene contenido (no es null/undefined), lo serializamos
                                challengeForm.expectedResult
                                ? JSON.stringify(
                                    challengeForm.expectedResult,
                                    null,
                                    2,
                                  )
                                : '' // En cualquier otro caso (inicial), string vacío para que no salga nada
                          }
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setChallengeForm({
                              ...challengeForm,
                              expectedResult: newValue,
                            });
                          }}
                          placeholder='[{"id": 1, "nombre": "Juan"}]'
                        />
                        {challengeErrors.expectedResult && (
                          <span className="eval-error-text">
                            {challengeErrors.expectedResult}
                          </span>
                        )}
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
                          placeholder="Describe la consulta SQL que debe construir el estudiante"
                        />
                        {challengeErrors.description && (
                          <span className="eval-error-text">
                            {challengeErrors.description}
                          </span>
                        )}
                      </div>

                      <div className="eval-form-group full">
                        <label>Esquema de base de datos</label>
                        <textarea
                          className="eval-code-textarea"
                          value={challengeForm.schemaDefinition}
                          onChange={(event) =>
                            handleChallengeChange(
                              'schemaDefinition',
                              event.target.value,
                            )
                          }
                          placeholder={`CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  city VARCHAR(80) NOT NULL
);`}
                        />
                        {challengeErrors.schemaDefinition && (
                          <span className="eval-error-text">
                            {challengeErrors.schemaDefinition}
                          </span>
                        )}
                      </div>

                      <div className="eval-form-group full">
                        <label>Datos iniciales de prueba</label>
                        <textarea
                          className="eval-code-textarea"
                          value={challengeForm.seedScript}
                          onChange={(event) =>
                            handleChallengeChange(
                              'seedScript',
                              event.target.value,
                            )
                          }
                          placeholder={`INSERT INTO customers (name, city) VALUES
('Ana Pérez', 'Bogotá'),
('Carlos Ruiz', 'Medellín');`}
                        />
                        {challengeErrors.seedScript && (
                          <span className="eval-error-text">
                            {challengeErrors.seedScript}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="eval-secondary-btn add-btn"
                      onClick={addChallenge}
                    >
                      {editingChallengeId ? 'Guardar Cambios' : 'Agregar Reto'}
                    </button>

                    {evaluationErrors.challenges && (
                      <p className="eval-error-text block">
                        {evaluationErrors.challenges}
                      </p>
                    )}
                  </div>
                </>
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

                    {/*
                      <span
                        className={`eval-status-badge ${
                          evaluation.status === 'ACTIVE' ? 'active' : 'inactive'
                        }`}
                      >
                        {getStatusLabel(evaluation.status)}
                      </span>
                    */}
                  </div>

                  <div className="eval-card-dates">
                    <span>
                      Inicio:{' '}
                      {new Date(evaluation.startDate).toLocaleDateString()}
                    </span>
                    <span>
                      Cierre:{' '}
                      {new Date(evaluation.endDate).toLocaleDateString()}
                    </span>
                    <span>Duración: {evaluation.durationMinutes} min</span>
                    <span>Intentos: {evaluation.maxAttempts}</span>
                    <span>Retos: {evaluation.challenges?.length || 0}</span>
                  </div>

                  <div className="eval-card-summary">
                    {evaluation.challenges?.map((challenge) => {
                      const canSubmit = isChallengeAvailableForStudent(
                        evaluation,
                        challenge,
                      );

                      return (
                        <div
                          className="eval-card-summary-row"
                          key={challenge.id}
                        >
                          <strong>{challenge.title}</strong>

                          <span>
                            {getDifficultyLabel(challenge.difficulty)}
                          </span>

                          {isStudent && (
                            <span
                              className={
                                canSubmit
                                  ? 'eval-mini-available'
                                  : 'eval-mini-unavailable'
                              }
                            >
                              {canSubmit ? 'Disponible' : 'No disponible'}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="eval-card-actions">
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
                          onClick={() => handleEdit(evaluation)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="eval-danger-btn"
                          onClick={() => handleDelete(evaluation.id.toString())}
                        >
                          Eliminar
                        </button>
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
