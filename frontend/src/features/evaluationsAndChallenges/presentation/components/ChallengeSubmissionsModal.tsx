import { useEffect, useState } from 'react';
import type { SubmissionDetail } from '../../../submissions/domain/submissions.types';
import { submissionsApi } from '../../../submissions/infrastructure/submissionsApi';
import '../styles/EvaluationsAndChallengesPage.css';

const STATUS_LABELS: Record<string, string> = {
  ACCEPTED: 'Aceptado',
  WRONG_ANSWER: 'Respuesta incorrecta',
  RUNTIME_ERROR: 'Error de ejecución',
  TIME_LIMIT_EXCEEDED: 'Tiempo límite',
  SYNTAX_ERROR: 'Error de sintaxis',
  PERMISSION_ERROR: 'Error de permisos',
  QUEUED: 'En cola',
  RUNNING: 'Procesando',
};

const STATUS_CLASS: Record<string, string> = {
  ACCEPTED: 'accepted',
  WRONG_ANSWER: 'rejected',
  RUNTIME_ERROR: 'rejected',
  TIME_LIMIT_EXCEEDED: 'rejected',
  SYNTAX_ERROR: 'rejected',
  PERMISSION_ERROR: 'rejected',
  QUEUED: 'pending',
  RUNNING: 'pending',
};

interface Props {
  evaluationId: string;
  challengeId: string;
  challengeTitle: string;
  token: string;
  onClose: () => void;
}

export function ChallengeSubmissionsModal({
  evaluationId,
  challengeId,
  challengeTitle,
  token,
  onClose,
}: Props) {
  const [submissions, setSubmissions] = useState<SubmissionDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    submissionsApi
      .getByEvaluationAndChallenge(evaluationId, challengeId, token)
      .then((data) => setSubmissions(Array.isArray(data) ? data : []))
      .catch((err: any) => setError(err?.message || 'Error al cargar las entregas.'))
      .finally(() => setIsLoading(false));
  }, [evaluationId, challengeId, token]);

  const toggleExpand = (id: string) =>
    setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="eval-modal-backdrop" role="dialog" aria-modal="true">
      <div className="eval-modal eval-modal-lg">
        <div className="eval-modal-header">
          <div>
            <span className="eval-page-eyebrow" style={{ fontSize: 12 }}>ENTREGAS</span>
            <h2 style={{ margin: '4px 0 0' }}>{challengeTitle}</h2>
          </div>
          <button type="button" className="eval-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="eval-modal-body" style={{ padding: '0 28px 28px' }}>
          {isLoading && <div className="eval-empty-state">Cargando entregas...</div>}
          {error && <div className="eval-warning-banner">{error}</div>}
          {!isLoading && !error && submissions.length === 0 && (
            <div className="eval-empty-state">Ningún estudiante ha enviado entregas para este reto.</div>
          )}

          {!isLoading && !error && submissions.length > 0 && (
            <div className="eval-submissions-list">
              {submissions.map((sub) => {
                const isOpen = expanded === sub.id;
                const statusClass = STATUS_CLASS[sub.status] ?? 'pending';
                const ai = sub.resultJson?.aiRecommendations ?? '';
                const aiScore = ai ? parseInt(ai.split('\n')[0], 10) : null;
                const aiBody = ai ? ai.split('\n').slice(1).join('\n').trim() : '';

                return (
                  <div key={sub.id} className="eval-submission-item">
                    <button
                      type="button"
                      className="eval-submission-summary"
                      onClick={() => toggleExpand(sub.id)}
                    >
                      <div className="eval-submission-student">
                        <strong>{sub.studentName}</strong>
                        <span>{sub.studentEmail}</span>
                      </div>
                      <div className="eval-submission-badges">
                        <span className={`eval-submission-status-badge ${statusClass}`}>
                          {STATUS_LABELS[sub.status] ?? sub.status}
                        </span>
                        <span className="eval-submission-score-badge">
                          {sub.score} pts
                        </span>
                        {typeof aiScore === 'number' && !isNaN(aiScore) && (
                          <span className="eval-submission-ai-badge">
                            IA {aiScore}/100
                          </span>
                        )}
                        <span className="eval-submission-time">
                          {sub.executionTimeMs != null ? `${sub.executionTimeMs} ms` : '—'}
                        </span>
                      </div>
                      <span className="eval-submission-toggle">{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {isOpen && (
                      <div className="eval-submission-detail">
                        <div className="eval-submission-query-box">
                          <label>Query enviado</label>
                          <pre>{sub.query}</pre>
                        </div>

                        {sub.resultJson?.error && (
                          <div className="eval-result-error-box" style={{ marginTop: 12 }}>
                            <strong>Error:</strong> {sub.resultJson.error}
                          </div>
                        )}

                        {aiBody && (
                          <div className="eval-ai-recommendations" style={{ marginTop: 12 }}>
                            <div className="eval-ai-recommendations-header">
                              <span className="eval-page-eyebrow" style={{ fontSize: 11 }}>
                                RECOMENDACIONES IA
                              </span>
                            </div>
                            <p className="eval-ai-recommendations-body">{aiBody}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
