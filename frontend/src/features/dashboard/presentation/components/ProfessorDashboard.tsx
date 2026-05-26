type ProfessorDashboardProps = {
  courseCount: number;
  isLoading: boolean;
  error: string;
};

export function ProfessorDashboard({
  courseCount,
  isLoading,
  error,
}: ProfessorDashboardProps) {
  return (
    <section className="dashboard-role-section">
      <div className="dashboard-heading">
        <span>Panel del profesor</span>
        <h1>Seguimiento de cursos y retos SQL</h1>
      </div>

      {error && <p className="dashboard-error-message">{error}</p>}

      <div className="stats-grid">
        <article className="stat-card">
          <span>Cursos disponibles</span>
          <strong>{isLoading ? '...' : courseCount}</strong>
          <p>Dato cargado desde el backend.</p>
        </article>
      </div>
    </section>
  );
}