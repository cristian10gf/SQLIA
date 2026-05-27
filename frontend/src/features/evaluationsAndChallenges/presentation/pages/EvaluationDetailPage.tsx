import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import { evaluationApi } from '../../infrastructure/evaluationApi';
import { evaluationChallengeApi } from '../../infrastructure/evaluationChallengeApi';
import { challengeApi } from '../../infrastructure/challengeApi';
import type {
  Challenge,
  Evaluation,
  SandboxStatusValue,
} from '../../domain/evaluationChallenge.types';
import { ChallengeCard } from '../components/ChallengeCard';
import { ChallengeModal } from '../components/ChallengeModal';
import { EvaluationModal } from '../components/EvaluationModal';
import { StudentAttemptModal } from '../components/StudentAttemptModal';
import { LeaderboardModal } from '../components/LeaderboardModal';
import { ChallengeSubmissionsModal } from '../components/ChallengeSubmissionsModal';
import { formatDate, getSessionUser } from '../utils/evaluationUtils';
import { submissionsApi } from '../../../submissions/infrastructure/submissionsApi';
import '../styles/EvaluationsAndChallengesPage.css';

interface ActiveAttempt {
  challengeId: number | string;
  startedAt: number;
}

export default function EvaluationDetailPage() {
  const { courseId, evaluationId } = useParams<{
    courseId: string;
    evaluationId: string;
  }>();
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
  const [sandboxStatuses, setSandboxStatuses] = useState<
    Record<string, SandboxStatusValue | null | undefined>
  >({});

  const [isLoading, setIsLoading] = useState(false);
  const [pageError, setPageError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  const [mySubmissionCount, setMySubmissionCount] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [viewingSubmissionsChallenge, setViewingSubmissionsChallenge] = useState<Challenge | null>(null);

  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(
    null,
  );
  const [showEvaluationModal, setShowEvaluationModal] = useState(false);

  const [activeAttempt, setActiveAttempt] = useState<ActiveAttempt | null>(
    null,
  );

  const loadData = useCallback(async () => {
    if (!evaluationId || !token) return;
    setIsLoading(true);
    setPageError('');
    try {
      let evalData: Evaluation;
      if (isStudent) {
        const listRes: any = await evaluationApi.listVisibleForStudent(
          courseId!,
          1,
          100,
          token,
        );
        const items: Evaluation[] =
          listRes?.data?.data ?? listRes?.data ?? listRes ?? [];
        const found = items.find(
          (e: Evaluation) => String(e.id) === evaluationId,
        );
        if (!found) throw new Error('Evaluación no encontrada o no disponible');
        evalData = found;
      } else {
        const evalRes: any = await evaluationApi.findById(evaluationId, token);
        evalData = evalRes?.data || evalRes;
      }
      setEvaluation(evalData);

      const chalRes: any =
        isProfessor || isAdmin
          ? await evaluationChallengeApi.listByEvaluation(
              evaluationId,
              {},
              token,
            )
          : await evaluationChallengeApi.listByEvaluationForStudent(
              evaluationId,
              token,
            );

      const chalPayload = chalRes?.data || chalRes;
      const challengeList: Challenge[] = Array.isArray(chalPayload)
        ? chalPayload
        : [];
      setChallenges(challengeList);

      if (isProfessor || isAdmin) {
        const statuses: Record<string, SandboxStatusValue | null> = {};
        await Promise.allSettled(
          challengeList.map(async (ch) => {
            try {
              const sbRes = await challengeApi.getSandbox(
                ch.id.toString(),
                token,
              );
              statuses[ch.id.toString()] = sbRes.data?.status ?? null;
            } catch {
              statuses[ch.id.toString()] = null;
            }
          }),
        );
        setSandboxStatuses(statuses);
      }

      if (isStudent && evaluationId && token) {
        try {
          const countRes = await submissionsApi.getMyCount(evaluationId, token);
          setMySubmissionCount(countRes.count ?? 0);
        } catch {
          setMySubmissionCount(0);
        }
      }
    } catch (err: any) {
      setPageError(
        err?.message || 'Error al cargar el detalle de la evaluación.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [evaluationId, token, role]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSandboxStatusChange = (
    challengeId: number | string,
    status: SandboxStatusValue | null,
  ) => {
    setSandboxStatuses((prev) => ({
      ...prev,
      [challengeId.toString()]: status,
    }));
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
    setActionMessage(
      editingChallenge
        ? 'Reto actualizado correctamente.'
        : 'Reto agregado correctamente.',
    );
    await loadData();
  };

  const handleDeleteChallenge = async (challengeId: number | string) => {
    if (!token || !evaluationId) return;
    try {
      await evaluationChallengeApi.removeAssociation(
        evaluationId,
        challengeId.toString(),
        token,
      );
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

  const handleStartChallenge = (_ev: Evaluation, ch: Challenge) => {
    setActiveAttempt({ challengeId: ch.id, startedAt: Date.now() });
    setActionMessage('');
  };

  const handleCloseAttempt = () => {
    setActiveAttempt(null);
    setActionMessage('Solución enviada. Revisa tu resultado cuando esté disponible.');
    if (isStudent && evaluationId && token) {
      submissionsApi.getMyCount(evaluationId, token)
        .then((r) => setMySubmissionCount(r.count ?? 0))
        .catch(() => {});
    }
  };

  const handleLogout = () => {
    authStorage.clearSession();
    navigate('/login');
  };

  const activeChallenge = activeAttempt
    ? (challenges.find(
        (ch) => ch.id.toString() === activeAttempt.challengeId.toString(),
      ) ?? null)
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
              onClick={() =>
                navigate(`/courses/evaluations-challenges/${courseId}`)
              }
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
                onClick={() => setShowLeaderboard(true)}
              >
                Ver ranking
              </button>
              <button
                type="button"
                className="eval-secondary-btn"
                onClick={() => setShowEvaluationModal(true)}
              >
                Editar evaluación
              </button>
              {isProfessor && (
                <button
                  type="button"
                  className="eval-primary-btn"
                  onClick={handleOpenAddChallenge}
                >
                  + Agregar reto
                </button>
              )}
            </div>
          )}
        </div>

        {actionMessage && (
          <div className="eval-success-banner">{actionMessage}</div>
        )}
        {pageError && <div className="eval-warning-banner">{pageError}</div>}

        {/* Evaluation metadata */}
        {evaluation && (
          <div className="eval-detail-panel" style={{ marginBottom: 24 }}>
            <div className="eval-detail-grid">
              <div>
                <strong>Estado</strong>
                <span
                  className={`eval-status-badge ${evaluation.isVisible ? 'active' : 'inactive'}`}
                  style={{ display: 'inline-block', marginTop: 6 }}
                >
                  {evaluation.isVisible ? 'Visible' : 'Oculta'}
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
              <p
                style={{
                  margin: '0 0 0',
                  color: '#607492',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
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
                  isAdmin={isAdmin}
                  token={token!}
                  sandboxStatus={sandboxStatuses[ch.id.toString()]}
                  submissionsUsed={isStudent ? mySubmissionCount : undefined}
                  onSandboxStatusChange={handleSandboxStatusChange}
                  onEdit={handleOpenEditChallenge}
                  onDelete={handleDeleteChallenge}
                  onStartChallenge={handleStartChallenge}
                  onViewSubmissions={(ch) => setViewingSubmissionsChallenge(ch)}
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
          onClose={() => {
            setShowChallengeModal(false);
            setEditingChallenge(null);
          }}
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
          token={token!}
          evaluationId={evaluationId!}
          onClose={handleCloseAttempt}
        />
      )}

      {showLeaderboard && evaluation && (
        <LeaderboardModal
          evaluationId={evaluation.id.toString()}
          evaluationTitle={evaluation.title}
          token={token!}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {viewingSubmissionsChallenge && evaluation && (
        <ChallengeSubmissionsModal
          evaluationId={evaluation.id.toString()}
          challengeId={viewingSubmissionsChallenge.id.toString()}
          challengeTitle={viewingSubmissionsChallenge.title}
          token={token!}
          onClose={() => setViewingSubmissionsChallenge(null)}
        />
      )}
    </DashboardLayout>
  );
}
