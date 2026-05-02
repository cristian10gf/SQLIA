import { Link } from 'react-router-dom';

type StudentDashboardProps = {
  courseCount: number;
  isLoading: boolean;
  error: string;
};

export function StudentDashboard({
  courseCount,
  isLoading,
  error,
}: StudentDashboardProps) {
  return (
    <section className="dashboard-role-section">
      <div className="dashboard-heading">
        <span>Panel del estudiante</span>
        <h1>Cursos, retos SQL y resultados</h1>
      </div>

      {error && <p className="dashboard-error-message">{error}</p>}

      <div className="stats-grid">
        <article className="stat-card">
          <span>Cursos inscritos</span>
          <strong>{isLoading ? '...' : courseCount}</strong>
          <p>Dato cargado desde el backend.</p>
        </article>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>Actividad académica</h2>
          <Link to="/dashboard/courses">Ver mis cursos</Link>
        </div>
      </div>
    </section>
  );
}