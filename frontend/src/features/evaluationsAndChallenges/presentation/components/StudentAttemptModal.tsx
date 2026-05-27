import { useEffect, useRef, useState } from 'react';
import type {
  Challenge,
  Evaluation,
} from '../../domain/evaluationChallenge.types';
import type { SubmissionResult } from '../../../submissions/domain/submissions.types';
import { submissionsApi } from '../../../submissions/infrastructure/submissionsApi';
import {
  formatAttemptCountdown,
  getAttemptRemainingMs,
  getDifficultyLabel,
} from '../utils/evaluationUtils';
import '../styles/EvaluationsAndChallengesPage.css';

const TERMINAL_STATUSES = new Set([
  'ACCEPTED',
  'WRONG_ANSWER',
  'RUNTIME_ERROR',
  'TIME_LIMIT_EXCEEDED',
  'SYNTAX_ERROR',
  'PERMISSION_ERROR',
]);

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: 'Aceptado',
  WRONG_ANSWER: 'Respuesta incorrecta',
  RUNTIME_ERROR: 'Error de ejecución',
  TIME_LIMIT_EXCEEDED: 'Tiempo límite excedido',
  SYNTAX_ERROR: 'Error de sintaxis',
  PERMISSION_ERROR: 'Error de permisos',
  QUEUED: 'En cola',
  PROCESSING: 'Procesando',
};

type Phase = 'idle' | 'submitting' | 'polling' | 'done';

interface StudentAttemptModalProps {
  evaluation: Evaluation;
  challenge: Challenge;
  startedAt: number;
  token: string;
  evaluationId: string;
  onClose: () => void;
}

export function StudentAttemptModal({
  evaluation,
  challenge,
  startedAt,
  token,
  evaluationId,
  onClose,
}: StudentAttemptModalProps) {
  const [solution, setSolution] = useState('');
  const [currentTime, setCurrentTime] = useState(() => new Date());
  const [phase, setPhase] = useState<Phase>('idle');
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setCurrentTime(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const remainingMs = getAttemptRemainingMs(
    startedAt,
    evaluation.durationMinutes || 90,
    currentTime,
  );
  const expired = remainingMs <= 0;

  const startPolling = (submissionId: string) => {
    setPhase('polling');
    let attempts = 0;
    const maxAttempts = 30;

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await submissionsApi.getById(submissionId, token);
        if (TERMINAL_STATUSES.has(res.status)) {
          clearInterval(pollRef.current!);
          setResult(res);
          setPhase('done');
        }
      } catch {
        // keep polling
      }
      if (attempts >= maxAttempts) {
        clearInterval(pollRef.current!);
        setPhase('done');
      }
    }, 2000);
  };

  const handleSubmit = async () => {
    if (!solution.trim()) return;
    setSubmitError('');
    setPhase('submitting');
    try {
      const res: any = await submissionsApi.send(
        { query: solution, challengeId: String(challenge.id), evaluationId },
        token,
      );
      const submissionId: string = res?.submissionId ?? res?.id ?? res?.data?.id;
      if (!submissionId) throw new Error('No se recibió el ID de la entrega.');
      startPolling(submissionId);
    } catch (err: any) {
      setSubmitError(err?.message || 'No se pudo enviar la solución.');
      setPhase('idle');
    }
  };

  const aiText = result?.resultJson?.aiRecommendations ?? '';
  const aiScore = aiText ? parseInt(aiText.split('\n')[0], 10) : null;
  const aiBody = aiText ? aiText.split('\n').slice(1).join('\n').trim() : '';

  const isAccepted = result?.status === 'ACCEPTED';

  return (
    <div
      className="eval-student-modal-backdrop"
      role="dialog"
      aria-modal="true"
    >
      <section className="eval-student-modal">
        <div className="eval-student-modal-header">
          <div>
            <span className="eval-page-eyebrow">RETO INICIADO</span>
            <h2>{challenge.title}</h2>
            <p>{challenge.description}</p>
          </div>
        </div>

        {phase !== 'done' && (
          <>
            <div className="eval-solution-box" style={{ marginBottom: '20px' }}>
              <label
                style={{
                  fontWeight: 'bold',
                  display: 'block',
                  marginBottom: '6px',
                }}
              >
                Esquema de la base de datos (Tablas disponibles)
              </label>
              <textarea
                className="eval-code-textarea"
                style={{
                  backgroundColor: '#f3f4f6',
                  fontFamily: 'monospace',
                  cursor: 'default',
                  minHeight: '120px',
                }}
                value={challenge.schemaDefinition}
                readOnly
              />
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
                disabled={expired || phase !== 'idle'}
              />
              {expired && (
                <span className="eval-error-text">El tiempo del reto terminó.</span>
              )}
              {submitError && (
                <span className="eval-error-text">{submitError}</span>
              )}

              <div className="eval-student-modal-actions">
                {phase === 'polling' && (
                  <span className="eval-polling-indicator">
                    Evaluando tu solución...
                  </span>
                )}
                <button
                  type="button"
                  className="eval-secondary-btn"
                  onClick={onClose}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="eval-primary-btn"
                  disabled={expired || phase !== 'idle' || !solution.trim()}
                  onClick={handleSubmit}
                >
                  {phase === 'submitting' ? 'Enviando...' : 'Enviar solución'}
                </button>
              </div>
            </div>
          </>
        )}

        {phase === 'done' && result && (
          <div className="eval-submission-result">
            <div
              className={`eval-result-status-banner ${isAccepted ? 'accepted' : 'rejected'}`}
            >
              <span className="eval-result-status-label">
                {STATUS_LABELS[result.status] ?? result.status}
              </span>
              <span className="eval-result-score">
                {result.score} pts
              </span>
            </div>

            <div className="eval-result-meta">
              <div className="eval-result-meta-item">
                <span>Tiempo de ejecución</span>
                <strong>{result.executionTimeMs ?? result.resultJson?.executionTimeMs ?? 0} ms</strong>
              </div>
              {result.resultJson?.engine && (
                <div className="eval-result-meta-item">
                  <span>Motor</span>
                  <strong>{result.resultJson.engine}</strong>
                </div>
              )}
              {typeof aiScore === 'number' && !isNaN(aiScore) && (
                <div className="eval-result-meta-item">
                  <span>Calificación IA</span>
                  <strong>{aiScore}/100</strong>
                </div>
              )}
            </div>

            {result.resultJson?.error && (
              <div className="eval-result-error-box">
                <strong>Error:</strong> {result.resultJson.error}
              </div>
            )}

            {aiBody && (
              <div className="eval-ai-recommendations">
                <div className="eval-ai-recommendations-header">
                  <span className="eval-page-eyebrow" style={{ fontSize: 12 }}>
                    RECOMENDACIONES IA
                  </span>
                </div>
                <p className="eval-ai-recommendations-body">{aiBody}</p>
              </div>
            )}

            {result.resultJson?.tests && result.resultJson.tests.length > 0 && (
              <div className="eval-result-tests">
                <strong style={{ fontSize: 14, color: '#41516d' }}>
                  Pruebas ({result.resultJson.tests.filter((t) => t.passed).length}/
                  {result.resultJson.tests.length} aprobadas)
                </strong>
                <div className="eval-result-tests-list">
                  {result.resultJson.tests.map((t, i) => (
                    <span
                      key={i}
                      className={`eval-test-badge ${t.passed ? 'pass' : 'fail'}`}
                    >
                      {t.passed ? '✓' : '✗'} Prueba {i + 1}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="eval-student-modal-actions">
              <button
                type="button"
                className="eval-primary-btn"
                onClick={onClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        {phase === 'done' && !result && (
          <div className="eval-submission-result">
            <p style={{ color: '#6a7d99' }}>
              No se pudo obtener el resultado. La evaluación puede estar en proceso.
            </p>
            <div className="eval-student-modal-actions">
              <button type="button" className="eval-primary-btn" onClick={onClose}>
                Cerrar
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
