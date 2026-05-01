export function ProfessorDashboard() {
  return (
    <section className="dashboard-role-section">
      <div className="dashboard-heading">
        <span>Panel del profesor</span>
        <h1>Seguimiento de cursos, retos y evaluaciones</h1>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Mis cursos</span>
          <strong>4</strong>
          <p>Cursos asignados al profesor.</p>
        </article>

        <article className="stat-card">
          <span>Retos SQL</span>
          <strong>21</strong>
          <p>Retos creados o en borrador.</p>
        </article>

        <article className="stat-card">
          <span>Evaluaciones</span>
          <strong>6</strong>
          <p>Parciales o actividades configuradas.</p>
        </article>

        <article className="stat-card">
          <span>Submissions pendientes</span>
          <strong>14</strong>
          <p>Entregas por revisar o procesar.</p>
        </article>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>Últimas entregas</h2>
          <button>Ver todas</button>
        </div>

        <div className="table-card">
          <div className="table-row table-head">
            <span>Estudiante</span>
            <span>Reto</span>
            <span>Estado</span>
            <span>Puntaje</span>
          </div>

          <div className="table-row">
            <span>Laura Martínez</span>
            <span>JOIN y agregaciones</span>
            <span className="status accepted">ACCEPTED</span>
            <span>100</span>
          </div>

          <div className="table-row">
            <span>Carlos Pérez</span>
            <span>Subconsultas</span>
            <span className="status warning">OPTIMIZATION</span>
            <span>82</span>
          </div>

          <div className="table-row">
            <span>Ana Gómez</span>
            <span>GROUP BY</span>
            <span className="status error">WRONG ANSWER</span>
            <span>45</span>
          </div>
        </div>
      </div>
    </section>
  );
}