import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import { evaluationApi } from '../../infrastructure/evaluationApi';
import { evaluationChallengeApi } from '../../infrastructure/evaluationChallengeApi';
import { challengeApi } from '../../infrastructure/challengeApi';
import type { Challenge, Evaluation, SandboxStatusValue } from '../../domain/evaluationChallenge.types';
import { ChallengeCard } from '../components/ChallengeCard';
import { ChallengeModal } from '../components/ChallengeModal';
import { EvaluationModal } from '../components/EvaluationModal';
import { StudentAttemptModal } from '../components/StudentAttemptModal';
import { formatDate, getSessionUser, getStatusLabel } from '../utils/evaluationUtils';
import '../styles/EvaluationsAndChallengesPage.css';

interface ActiveAttempt {
  challengeId: number;
  startedAt: number;
}

export default function EvaluationDetailPage() {
  const { courseId, evaluationId } = useParams<{ courseId: string; evaluationId: string }>();
  const navigate = useNavigate();

  const token = authStorage.getToken();
  const storedUser = authStorage.getUser();
  const sessionUser = getSessionUser();
  const role = storedUser?.role ?? sessionUser.role;

  const isAdmin = role === 'ADMIN';
  const isProfessor = role === 'PROFESSOR';
  const isStudent = role === 'STUDENT';

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sandboxStatuses, setSandboxStatuses] = useState<Record<string, SandboxStatusValue | null | undefined>>({});

  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

  const [activeAttempt, setActiveAttempt] = useState<ActiveAttempt | null>(null);

  const loadData = useCallback(async () => {
    if (!evaluationId || !token) return;
    setIsLoading(true);
    setPageError('');
    try {
      const evalRes: any = await evaluationApi.findById(evaluationId, token);
      const evalData: Evaluation = evalRes?.data || evalRes;
      setEvaluation(evalData);

      const chalRes: any =
        isProfessor || isAdmin
          ? await evaluationChallengeApi.listByEvaluation(evaluationId, {}, token)
          : await evaluationChallengeApi.listByEvaluationForStudent(evaluationId, token);

      const chalPayload = chalRes?.data || chalRes;
      const challengeList: Challenge[] = Array.isArray(chalPayload) ? chalPayload : [];
      setChallenges(challengeList);

      if (isProfessor || isAdmin) {
        const statuses: Record<string, SandboxStatusValue | null> = {};
        await Promise.allSettled(
          challengeList.map(async (ch) => {
            try {
              const sbRes = await challengeApi.getSandbox(ch.id.toString(), token);
              statuses[ch.id.toString()] = sbRes.data?.status ?? null;
            } catch {
              statuses[ch.id.toString()] = null;
            }
          }),
        );
        setSandboxStatuses(statuses);
      }
    } catch (err: any) {
      setPageError(err?.message || 'Error al cargar el detalle de la evaluación.');
    } finally {
      setIsLoading(false);
    }
  }, [evaluationId, token, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSandboxStatusChange = (challengeId: number | string, status: SandboxStatusValue | null) => {
    setSandboxStatuses((prev) => ({ ...prev, [challengeId.toString()]: status }));
  };

  const handleOpenAddChallenge = () => {
    setEditingChallenge(null);
    setShowChallengeModal(true);
  };

  const handleOpenEditChallenge = (ch: Challenge) => {
    setEditingChallenge(ch);
    setShowChallengeModal(true);
  };

  const handleChallengeSaved = async () => {
    setShowChallengeModal(false);
    setEditingChallenge(null);
    setActionMessage(editingChallenge ? 'Reto actualizado correctamente.' : 'Reto agregado correctamente.');
    await loadData();
  };

  const handleDeleteChallenge = async (challengeId: number) => {
    if (!token || !evaluationId) return;
    try {
      await evaluationChallengeApi.removeAssociation(evaluationId, challengeId.toString(), token);
      await challengeApi.remove(challengeId.toString(), token);
      setActionMessage('Reto eliminado correctamente.');
      await loadData();
    } catch (err: any) {
      setPageError(err?.message || 'No se pudo eliminar el reto.');
    }
  };

  const handleEvaluationSaved = async () => {
    setShowEvaluationModal(false);
    setActionMessage('Evaluación actualizada correctamente.');
    await loadData();
  };

  const handleStartChallenge = (ev: Evaluation, ch: Challenge) => {
    setActiveAttempt({ challengeId: ch.id, startedAt: Date.now() });
    setActionMessage('');
  };

  const handleSubmitSolution = (_challengeId: number, _solution: string) => {
    setActiveAttempt(null);
    setActionMessage('Solución enviada correctamente.');
  };

  const handleLogout = () => {
    authStorage.clearSession();
    navigate('/login');
  };

  const activeChallenge = activeAttempt
    ? challenges.find((ch) => ch.id === activeAttempt.challengeId) ?? null
    : null;

  return (
    <DashboardLayout
      role={role}
      userName={storedUser?.fullName || sessionUser.name}
      onLogout={handleLogout}
    >
      <section className="eval-content">
        {/* Back + header row */}
        <div className="eval-detail-page-header">
          <div className="eval-detail-page-nav">
            <button
              type="button"
              className="eval-back-btn"
              onClick={() => navigate(`/courses/evaluations-challenges/${courseId}`)}
            >
              ← Volver a evaluaciones
            </button>

            {evaluation && (
              <div className="eval-page-heading" style={{ marginBottom: 0 }}>
                <span className="eval-page-eyebrow">DETALLE DE EVALUACIÓN</span>
                <h1>{evaluation.title}</h1>
              </div>
            )}
          </div>

          {(isProfessor || isAdmin) && evaluation && (
            <div className="eval-detail-page-actions">
              <button
                type="button"
                className="eval-secondary-btn"
                onClick={() => setShowEvaluationModal(true)}
              >
                Editar evaluación
              </button>
              {isProfessor && (
                <button type="button" className="eval-primary-btn" onClick={handleOpenAddChallenge}>
                  + Agregar reto
                </button>
              )}
            </div>
          )}
        </div>

        {actionMessage && <div className="eval-success-banner">{actionMessage}</div>}
        {pageError && <div className="eval-warning-banner">{pageError}</div>}

        {/* Evaluation metadata */}
        {evaluation && (
          <div className="eval-detail-panel" style={{ marginBottom: 24 }}>
            <div className="eval-detail-grid">
              <div>
                <strong>Estado</strong>
                <span className={`eval-status-badge ${evaluation.status === 'ACTIVE' ? 'active' : 'inactive'}`} style={{ display: 'inline-block', marginTop: 6 }}>
                  {getStatusLabel(evaluation.status)}
                </span>
              </div>
              <div>
                <strong>Inicio</strong>
                <span>{formatDate(evaluation.startDate)}</span>
              </div>
              <div>
                <strong>Cierre</strong>
                <span>{formatDate(evaluation.endDate)}</span>
              </div>
              <div>
                <strong>Duración</strong>
                <span>{evaluation.durationMinutes} min</span>
              </div>
              <div>
                <strong>Intentos máx.</strong>
                <span>{evaluation.maxAttempts}</span>
              </div>
              <div>
                <strong>Retos</strong>
                <span>{challenges.length}</span>
              </div>
            </div>
            {evaluation.description && (
              <p style={{ margin: '0 0 0', color: '#607492', fontSize: 14, lineHeight: 1.5 }}>
                {evaluation.description}
              </p>
            )}
          </div>
        )}

        {/* Challenges list */}
        <div className="eval-list-panel" style={{ marginTop: 0 }}>
          <div className="eval-panel-header">
            <h2>Retos de la evaluación</h2>
          </div>

          {isLoading ? (
            <div className="eval-empty-state">Cargando retos...</div>
          ) : challenges.length === 0 ? (
            <div className="eval-empty-state">
              {isProfessor
                ? 'Esta evaluación no tiene retos. Usa "+ Agregar reto" para agregar el primero.'
                : 'Esta evaluación no tiene retos disponibles.'}
            </div>
          ) : (
            <div className="eval-detail-challenges">
              {challenges.map((ch) => (
                <ChallengeCard
                  key={ch.id}
                  challenge={ch}
                  evaluation={evaluation!}
                  isProfessor={isProfessor}
                  isStudent={isStudent}
                  token={token!}
                  sandboxStatus={sandboxStatuses[ch.id.toString()]}
                  onSandboxStatusChange={handleSandboxStatusChange}
                  onEdit={handleOpenEditChallenge}
                  onDelete={handleDeleteChallenge}
                  onStartChallenge={handleStartChallenge}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {showChallengeModal && evaluation && (
        <ChallengeModal
          challenge={editingChallenge}
          evaluationId={evaluation.id}
          courseId={courseId!}
          token={token!}
          challengeCount={challenges.length}
          onSave={handleChallengeSaved}
          onClose={() => { setShowChallengeModal(false); setEditingChallenge(null); }}
        />
      )}

      {showEvaluationModal && evaluation && (
        <EvaluationModal
          evaluation={evaluation}
          courseId={courseId!}
          token={token!}
          onSave={handleEvaluationSaved}
          onClose={() => setShowEvaluationModal(false)}
        />
      )}

      {isStudent && activeAttempt && evaluation && activeChallenge && (
        <StudentAttemptModal
          evaluation={evaluation}
          challenge={activeChallenge}
          startedAt={activeAttempt.startedAt}
          onSubmit={handleSubmitSolution}
        />
      )}
    </DashboardLayout>
  );
}
