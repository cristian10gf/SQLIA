import { useNavigate } from 'react-router-dom';
import type { Evaluation } from '../../domain/evaluationChallenge.types';
import { formatDate, getStatusLabel } from '../utils/evaluationUtils';
import '../styles/EvaluationsAndChallengesPage.css';

interface EvaluationCardProps {
  evaluation: Evaluation;
  courseId: string;
  isProfessor: boolean;
  isAdmin: boolean;
  onEdit: (evaluation: Evaluation) => void;
  onDelete: (evaluationId: number) => void;
}

export function EvaluationCard({
  evaluation,
  courseId,
  isProfessor,
  isAdmin,
  onEdit,
  onDelete,
}: EvaluationCardProps) {
  const navigate = useNavigate();
  const challengeCount = evaluation.challenges?.length || 0;

  const handleCardClick = () => {
    navigate(`/courses/evaluations-challenges/${courseId}/evaluation/${evaluation.id}`);
  };

  return (
    <article className="eval-card eval-card-clickable">
      <div
        className="eval-card-body"
        onClick={handleCardClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCardClick(); }}
        aria-label={`Ver retos de ${evaluation.title}`}
      >
        <div className="eval-card-header">
          <div>
            <h3>{evaluation.title}</h3>
            <p>{evaluation.description}</p>
          </div>
          <span className={`eval-status-badge ${evaluation.status === 'ACTIVE' ? 'active' : 'inactive'}`}>
            {getStatusLabel(evaluation.status)}
          </span>
        </div>

        <div className="eval-card-dates">
          <span>Inicio: {formatDate(evaluation.startDate)}</span>
          <span>Cierre: {formatDate(evaluation.endDate)}</span>
          <span>Duración: {evaluation.durationMinutes || 90} min</span>
          <span>Intentos: {evaluation.maxAttempts}</span>
          <span>{challengeCount} reto{challengeCount !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {(isProfessor || isAdmin) && (
        <div className="eval-card-actions">
          <button
            type="button"
            className="eval-secondary-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(evaluation); }}
          >
            Editar
          </button>
          {isProfessor && (
            <button
              type="button"
              className="eval-danger-btn"
              onClick={(e) => { e.stopPropagation(); onDelete(evaluation.id); }}
            >
              Eliminar
            </button>
          )}
        </div>
      )}
    </article>
  );
}
