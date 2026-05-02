import { Link } from 'react-router-dom';

type AdminDashboardProps = {
  courseCount: number;
  isLoading: boolean;
  error: string;
};

export function AdminDashboard({
  courseCount,
  isLoading,
  error,
}: AdminDashboardProps) {
  return (
    <section className="dashboard-role-section">
      <div className="dashboard-heading">
        <span>Resumen administrativo</span>
        <h1>Gestión general de la plataforma</h1>
      </div>

      {error && <p className="dashboard-error-message">{error}</p>}

      <div className="stats-grid">
        <article className="stat-card">
          <span>Cursos registrados</span>
          <strong>{isLoading ? '...' : courseCount}</strong>
          <p>Dato cargado desde el backend.</p>
        </article>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>Acciones disponibles</h2>
          <Link to="/dashboard/courses">Ver cursos</Link>
        </div>
      </div>
    </section>
  );
}