type StudentDashboardProps = {
  courseCount: number;
  isLoading: boolean;
  error: string;
};

export function StudentDashboard({
  courseCount,
  isLoading,
}: StudentDashboardProps) {
  return (
    <section className="dashboard-role-section">
      <div className="dashboard-heading">
        <span>Panel del estudiante</span>
        <h1>Cursos, retos SQL y resultados</h1>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Cursos inscritos</span>
          <strong>{isLoading ? '...' : courseCount}</strong>
          <p>Dato cargado desde el backend.</p>
        </article>
      </div>
    </section>
  );
}