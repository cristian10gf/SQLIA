export function StudentDashboard() {
  return (
    <section className="dashboard-role-section">
      <div className="dashboard-heading">
        <span>Panel del estudiante</span>
        <h1>Retos SQL, resultados y recomendaciones</h1>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Cursos inscritos</span>
          <strong>3</strong>
          <p>Cursos activos disponibles.</p>
        </article>

        <article className="stat-card">
          <span>Retos disponibles</span>
          <strong>9</strong>
          <p>Ejercicios publicados para resolver.</p>
        </article>

        <article className="stat-card">
          <span>Entregas realizadas</span>
          <strong>17</strong>
          <p>Consultas enviadas al sistema.</p>
        </article>

        <article className="stat-card">
          <span>Promedio actual</span>
          <strong>86</strong>
          <p>Promedio general de resultados.</p>
        </article>
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h2>Retos recomendados</h2>
          <button>Ver retos</button>
        </div>

        <div className="challenge-list">
          <article className="challenge-card">
            <div>
              <h3>Clientes con más de tres compras</h3>
              <p>SELECT, JOIN, GROUP BY, HAVING</p>
            </div>

            <span>Medium</span>
          </article>

          <article className="challenge-card">
            <div>
              <h3>Ventas por ciudad y fecha</h3>
              <p>JOIN, WHERE, ORDER BY</p>
            </div>

            <span>Easy</span>
          </article>

          <article className="challenge-card">
            <div>
              <h3>Optimización con índices</h3>
              <p>Performance, Indexes, EXPLAIN</p>
            </div>

            <span>Hard</span>
          </article>
        </div>
      </div>
    </section>
  );
}