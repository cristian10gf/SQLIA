import { useEffect, useState } from 'react';
import type { Challenge, Evaluation } from '../../domain/evaluationChallenge.types';
import { formatAttemptCountdown, getAttemptRemainingMs, getDifficultyLabel } from '../utils/evaluationUtils';
import '../styles/EvaluationsAndChallengesPage.css';

interface StudentAttemptModalProps {
  evaluation: Evaluation;
  challenge: Challenge;
  startedAt: number;
  onSubmit: (challengeId: number | string, solution: string) => void;
}

export function StudentAttemptModal({ evaluation, challenge, startedAt, onSubmit }: StudentAttemptModalProps) {
  const [solution, setSolution] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remainingMs = getAttemptRemainingMs(startedAt, evaluation.durationMinutes || 90, currentTime);
  const expired = remainingMs <= 0;

  return (
    <div className="eval-student-modal-backdrop" role="dialog" aria-modal="true">
      <section className="eval-student-modal">
        <div className="eval-student-modal-header">
          <div>
            <span className="eval-page-eyebrow">RETO INICIADO</span>
            <h2>{challenge.title}</h2>
            <p>{challenge.description}</p>
          </div>
        </div>

        <div className="eval-challenge-tags">
          <span>{challenge.databaseEngine}</span>
          <span>Límite ejecución: {challenge.timeLimitMs} ms</span>
          <span>{getDifficultyLabel(challenge.difficulty)}</span>
          <span>Duración: {evaluation.durationMinutes || 90} min</span>
        </div>

        <div className={`eval-attempt-timer ${expired ? 'expired' : ''}`}>
          <span>Tiempo del reto</span>
          <strong>{formatAttemptCountdown(remainingMs)}</strong>
        </div>

        <div className="eval-solution-box">
          <label>Tu solución SQL</label>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Escribe aquí tu solución."
            disabled={expired}
          />
          {expired && <span className="eval-error-text">El tiempo del reto terminó.</span>}

          <div className="eval-student-modal-actions">
            <button
              type="button"
              className="eval-primary-btn"
              disabled={expired}
              onClick={() => onSubmit(challenge.id, solution)}
            >
              Enviar solución
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
