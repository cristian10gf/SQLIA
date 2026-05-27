import '../styles/EvaluationsAndChallengesPage.css';

interface MetricsGridProps {
  evaluationsCount: number;
  publishedChallengesCount: number;
  nextClosingDate?: string;
}

export function MetricsGrid({ evaluationsCount, publishedChallengesCount, nextClosingDate }: MetricsGridProps) {
  return (
    <section className={`eval-metrics-grid ${nextClosingDate === undefined ? 'eval-metrics-grid-three' : ''}`}>
      <article className="eval-metric-card">
        <h3>Evaluaciones registradas</h3>
        <strong>{evaluationsCount}</strong>
        <p>Total de evaluaciones cargadas en el módulo.</p>
      </article>

      <article className="eval-metric-card">
        <h3>Retos publicados</h3>
        <strong>{publishedChallengesCount}</strong>
        <p>Retos SQL públicos para estudiantes.</p>
      </article>

      {nextClosingDate !== undefined && (
        <article className="eval-metric-card eval-date-card">
          <h3>Próximo cierre</h3>
          <strong>{nextClosingDate}</strong>
          <p>Fecha de cierre más próxima.</p>
        </article>
      )}
    </section>
  );
}
