export function AdminDashboard() {
  return (
    <section className="dashboard-role-section">
      <div className="dashboard-heading">
        <span>Resumen administrativo</span>
        <h1>Gestión general de la plataforma</h1>
      </div>

      <div className="stats-grid">
        <article className="stat-card">
          <span>Usuarios registrados</span>
          <strong>128</strong>
          <p>Estudiantes, profesores y administradores.</p>
        </article>

        <article className="stat-card">
          <span>Profesores</span>
          <strong>12</strong>
          <p>Docentes activos en la plataforma.</p>
        </article>

        <article className="stat-card">
          <span>Cursos activos</span>
          <strong>18</strong>
          <p>Cursos con retos SQL configurados.</p>
        </article>

        <article className="stat-card">
          <span>Retos publicados</span>
          <strong>46</strong>
          <p>Ejercicios disponibles para estudiantes.</p>
        </article>
      </div>
    </section>
  );
}