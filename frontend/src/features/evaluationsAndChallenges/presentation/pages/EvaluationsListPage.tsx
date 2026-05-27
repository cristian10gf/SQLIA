import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import { evaluationApi } from '../../infrastructure/evaluationApi';
import { evaluationChallengeApi } from '../../infrastructure/evaluationChallengeApi';
import type { Evaluation } from '../../domain/evaluationChallenge.types';
import { MetricsGrid } from '../components/MetricsGrid';
import { EvaluationCard } from '../components/EvaluationCard';
import { EvaluationModal } from '../components/EvaluationModal';
import {
  countPublishedChallenges,
  getNextClosingDate,
  getSessionUser,
} from '../utils/evaluationUtils';
import '../styles/EvaluationsAndChallengesPage.css';

export default function EvaluationsListPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const token = authStorage.getToken();
  const storedUser = authStorage.getUser();
  const sessionUser = getSessionUser();
  const role = storedUser?.role ?? sessionUser.role;

  const isAdmin = role === 'ADMIN';
  const isProfessor = role === 'PROFESSOR';
  const isStudent = role === 'STUDENT';

  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [pageError, setPageError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showEvaluationModal, setShowEvaluationModal] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<Evaluation | null>(null);

  const loadEvaluations = useCallback(async () => {
    if (!courseId || !token) return;
    setIsLoading(true);
    setPageError('');
    try {
      const response: any =
        isProfessor || isAdmin
          ? await evaluationApi.listForProfessor(courseId, { limit: 50 }, token)
          : await evaluationApi.listVisibleForStudent(courseId, 1, 50, token);

      const rawData = response?.data || response;
      const list: Evaluation[] = Array.isArray(rawData) ? rawData : [];

      const enriched = await Promise.all(
        list.map(async (ev) => {
          try {
            const res: any =
              isProfessor || isAdmin
                ? await evaluationChallengeApi.listByEvaluation(
                    ev.id.toString(),
                    { visibility: 'visible' },
                    token,
                  )
                : await evaluationChallengeApi.listByEvaluationForStudent(ev.id.toString(), token);
            return { ...ev, challenges: res?.data || res || [] };
          } catch {
            return { ...ev, challenges: [] };
          }
        }),
      );

      setEvaluations(enriched);
    } catch (err: any) {
      setPageError(err?.message || 'Error al cargar las evaluaciones.');
    } finally {
      setIsLoading(false);
    }
  }, [courseId, token, role]);

  useEffect(() => {
    loadEvaluations();
  }, [loadEvaluations]);

  const filteredEvaluations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return evaluations;
    return evaluations.filter((ev) =>
      [ev.title, ev.description, ev.courseName]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term),
    );
  }, [evaluations, searchTerm]);

  const publishedCount = useMemo(() => countPublishedChallenges(evaluations), [evaluations]);
  const nextClose = useMemo(() => getNextClosingDate(evaluations), [evaluations]);

  const handleOpenCreate = () => {
    setEditingEvaluation(null);
    setShowEvaluationModal(true);
  };

  const handleOpenEdit = (ev: Evaluation) => {
    setEditingEvaluation(ev);
    setShowEvaluationModal(true);
  };

  const handleModalSave = async () => {
    const wasEditing = Boolean(editingEvaluation);
    setShowEvaluationModal(false);
    setEditingEvaluation(null);
    setActionMessage(wasEditing ? 'Evaluación actualizada correctamente.' : 'Evaluación creada correctamente.');
    await loadEvaluations();
  };

  const handleDelete = async (evaluationId: number) => {
    if (!token) return;
    try {
      await evaluationApi.remove(evaluationId.toString(), token);
      setActionMessage('Evaluación eliminada correctamente.');
      await loadEvaluations();
    } catch (err: any) {
      setPageError(err?.message || 'No se pudo eliminar la evaluación.');
    }
  };

  const handleLogout = () => {
    authStorage.clearSession();
    navigate('/login');
  };

  return (
    <DashboardLayout
      role={role}
      userName={storedUser?.fullName || sessionUser.name}
      onLogout={handleLogout}
    >
      <section className="eval-content">
        <div className="eval-page-heading-row">
          <div className="eval-page-heading">
            <span className="eval-page-eyebrow">
              {isAdmin ? 'RESUMEN ADMINISTRATIVO' : isProfessor ? 'GESTIÓN ACADÉMICA' : 'EVALUACIONES'}
            </span>
            <h1>
              {isAdmin
                ? 'Evaluaciones y retos del curso'
                : isProfessor
                  ? 'Gestión de evaluaciones'
                  : 'Evaluaciones disponibles'}
            </h1>
          </div>

          {isProfessor && (
            <button type="button" className="eval-primary-btn" onClick={handleOpenCreate}>
              + Nueva evaluación
            </button>
          )}
        </div>

        {actionMessage && <div className="eval-success-banner">{actionMessage}</div>}
        {pageError && <div className="eval-warning-banner">{pageError}</div>}

        <MetricsGrid
          evaluationsCount={evaluations.length}
          publishedChallengesCount={publishedCount}
          nextClosingDate={isStudent ? nextClose : undefined}
        />

        <div className="eval-list-panel" style={{ marginTop: 0 }}>
          <div className="eval-panel-header">
            <h2>
              {isAdmin
                ? 'Vista general'
                : isProfessor
                  ? 'Evaluaciones registradas'
                  : 'Evaluaciones del curso'}
            </h2>
          </div>

          <div className="eval-list-tools">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar evaluación por nombre o descripción..."
            />
          </div>

          {isLoading ? (
            <div className="eval-empty-state">Cargando evaluaciones...</div>
          ) : filteredEvaluations.length === 0 ? (
            <div className="eval-empty-state">No se encontraron evaluaciones.</div>
          ) : (
            <div className="eval-cards-list">
              {filteredEvaluations.map((ev) => (
                <EvaluationCard
                  key={ev.id}
                  evaluation={ev}
                  courseId={courseId!}
                  isProfessor={isProfessor}
                  isAdmin={isAdmin}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {showEvaluationModal && (
        <EvaluationModal
          evaluation={editingEvaluation}
          courseId={courseId!}
          token={token!}
          onSave={handleModalSave}
          onClose={() => { setShowEvaluationModal(false); setEditingEvaluation(null); }}
        />
      )}
    </DashboardLayout>
  );
}
