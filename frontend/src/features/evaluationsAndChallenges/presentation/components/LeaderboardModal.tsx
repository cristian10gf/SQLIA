import { useEffect, useState } from 'react';
import type { LeaderboardEntry } from '../../../submissions/domain/submissions.types';
import { submissionsApi } from '../../../submissions/infrastructure/submissionsApi';
import '../styles/EvaluationsAndChallengesPage.css';

interface LeaderboardModalProps {
  evaluationId: string;
  evaluationTitle: string;
  token: string;
  onClose: () => void;
}

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function LeaderboardModal({
  evaluationId,
  evaluationTitle,
  token,
  onClose,
}: LeaderboardModalProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    submissionsApi
      .getLeaderboard(evaluationId, token)
      .then((data) => setEntries(Array.isArray(data) ? data : []))
      .catch((err: any) => setError(err?.message || 'Error al cargar el ranking.'))
      .finally(() => setIsLoading(false));
  }, [evaluationId, token]);

  return (
    <div className="eval-modal-backdrop" role="dialog" aria-modal="true">
      <div className="eval-modal eval-modal-lg">
        <div className="eval-modal-header">
          <div>
            <span className="eval-page-eyebrow" style={{ fontSize: 12 }}>RANKING</span>
            <h2 style={{ margin: '4px 0 0' }}>{evaluationTitle}</h2>
          </div>
          <button type="button" className="eval-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="eval-modal-body" style={{ padding: '0 28px 28px' }}>
          {isLoading && (
            <div className="eval-empty-state">Cargando ranking...</div>
          )}
          {error && (
            <div className="eval-warning-banner">{error}</div>
          )}
          {!isLoading && !error && entries.length === 0 && (
            <div className="eval-empty-state">Aún no hay entregas en esta evaluación.</div>
          )}
          {!isLoading && !error && entries.length > 0 && (
            <div className="eval-leaderboard">
              <div className="eval-leaderboard-header">
                <span>#</span>
                <span>Estudiante</span>
                <span>Retos</span>
                <span>Entregas</span>
                <span>Puntaje</span>
              </div>
              {entries.map((entry, idx) => {
                const rank = idx + 1;
                const medal = MEDAL[rank] ?? '';
                const isTop3 = rank <= 3;
                return (
                  <div
                    key={entry.studentId}
                    className={`eval-leaderboard-row ${isTop3 ? 'top3' : ''}`}
                  >
                    <span className="eval-leaderboard-rank">
                      {medal || rank}
                    </span>
                    <div className="eval-leaderboard-student">
                      <strong>{entry.studentName}</strong>
                      <span>{entry.studentEmail}</span>
                    </div>
                    <span className="eval-leaderboard-cell">{entry.challengesSolved}</span>
                    <span className="eval-leaderboard-cell">{entry.submissionCount}</span>
                    <span className="eval-leaderboard-score">{entry.totalScore} pts</span>
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
