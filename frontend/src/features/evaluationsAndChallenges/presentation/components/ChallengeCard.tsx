import type { Challenge, Evaluation, SandboxStatusValue } from '../../domain/evaluationChallenge.types';
import {
  getDifficultyLabel,
  getChallengeStatusLabel,
  isChallengeAvailableForStudent,
} from '../utils/evaluationUtils';
import { SandboxActionButton } from './SandboxActionButton';
import '../styles/EvaluationsAndChallengesPage.css';

interface ChallengeCardProps {
  challenge: Challenge;
  evaluation: Evaluation;
  isProfessor: boolean;
  isStudent: boolean;
  token: string;
  sandboxStatus: SandboxStatusValue | null | undefined;
  submissionsUsed?: number;
  onSandboxStatusChange: (challengeId: number | string, status: SandboxStatusValue | null) => void;
  onEdit: (challenge: Challenge) => void;
  onDelete: (challengeId: number | string) => void;
  onStartChallenge: (evaluation: Evaluation, challenge: Challenge) => void;
}

export function ChallengeCard({
  challenge,
  evaluation,
  isProfessor,
  isStudent,
  token,
  sandboxStatus,
  submissionsUsed,
  onSandboxStatusChange,
  onEdit,
  onDelete,
  onStartChallenge,
}: ChallengeCardProps) {
  const available = isChallengeAvailableForStudent(evaluation, challenge);
  const maxReached =
    typeof submissionsUsed === 'number' &&
    typeof evaluation.maxAttempts === 'number' &&
    submissionsUsed >= evaluation.maxAttempts;

  const canSubmit = available && !maxReached;

  const studentBtnLabel = !available
    ? 'No disponible'
    : maxReached
      ? 'Intentos agotados'
      : 'Iniciar reto';

  return (
    <article className="eval-detail-challenge">
      <div className="eval-challenge-upper-row">
        <div className="eval-challenge-title-row">
          <strong>{challenge.title}</strong>
          <span className={`eval-challenge-status ${challenge.visibility.toLowerCase()}`}>
            {getChallengeStatusLabel(challenge.visibility)}
          </span>
        </div>

        <div className="eval-inline-actions">
          {isProfessor && (
            <>
              <button type="button" className="eval-secondary-btn eval-small-btn" onClick={() => onEdit(challenge)}>
                Editar
              </button>
              <SandboxActionButton
                challenge={challenge}
                token={token}
                sandboxStatus={sandboxStatus}
                onStatusChange={onSandboxStatusChange}
                small
              />
              <button type="button" className="eval-danger-btn eval-small-btn" onClick={() => onDelete(challenge.id)}>
                Eliminar
              </button>
            </>
          )}

          {isStudent && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <button
                type="button"
                className="eval-primary-btn eval-start-challenge-btn"
                disabled={!canSubmit}
                onClick={() => onStartChallenge(evaluation, challenge)}
              >
                {studentBtnLabel}
              </button>
              {isStudent && typeof submissionsUsed === 'number' && typeof evaluation.maxAttempts === 'number' && (
                <span style={{ fontSize: 12, color: maxReached ? '#b91c1c' : '#607492', fontWeight: 700 }}>
                  {submissionsUsed}/{evaluation.maxAttempts} intentos
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <p>{challenge.description}</p>

      <div className="eval-challenge-tags">
        <span>{challenge.databaseEngine}</span>
        <span>Límite: {challenge.timeLimitMs} ms</span>
        <span>{getDifficultyLabel(challenge.difficulty)}</span>
        <span>Puntos: {challenge.points || 0}</span>
      </div>

      {isProfessor && (
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
    </article>
  );
}
