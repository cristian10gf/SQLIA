import { NavLink } from 'react-router-dom';
import '../styles/DashboardLayout.css';

export type DashboardRole = 'ADMIN' | 'PROFESSOR' | 'STUDENT';

type DashboardLayoutProps = {
  role: DashboardRole;
  userName: string;
  children: React.ReactNode;
};

type MenuItem = {
  label: string;
  path: string;
};

const menuByRole: Record<DashboardRole, MenuItem[]> = {
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Usuarios', path: '/dashboard/users' },
    { label: 'Profesores', path: '/dashboard/professors' },
    { label: 'Cursos', path: '/dashboard/courses' },
    { label: 'Reportes', path: '/dashboard/reports' },
  ],

  PROFESSOR: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Mis cursos', path: '/dashboard/courses' },
    { label: 'Retos SQL', path: '/dashboard/challenges' },
    { label: 'Evaluaciones', path: '/dashboard/evaluations' },
    { label: 'Submissions', path: '/dashboard/submissions' },
    { label: 'Reportes', path: '/dashboard/reports' },
  ],

  STUDENT: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Mis cursos', path: '/dashboard/courses' },
    { label: 'Retos disponibles', path: '/dashboard/challenges' },
    { label: 'Mis resultados', path: '/dashboard/results' },
    { label: 'Recomendaciones', path: '/dashboard/recommendations' },
  ],
};

const roleLabel: Record<DashboardRole, string> = {
  ADMIN: 'Administrador',
  PROFESSOR: 'Profesor',
  STUDENT: 'Estudiante',
};

export function DashboardLayout({ role, userName, children }: DashboardLayoutProps) {
  const menuItems = menuByRole[role];

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">SQL</div>

          <div>
            <h1>SQLIA</h1>
            <p>Evaluación SQL</p>
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.path}
              className={({ isActive }) =>
                isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span>Rol actual</span>
          <strong>{roleLabel[role]}</strong>
        </div>
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-navbar">
          <div>
            <p className="navbar-eyebrow">Panel principal</p>
            <h2>{roleLabel[role]}</h2>
          </div>

          <div className="navbar-user">
            <div className="user-avatar">
              {userName
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div>
              <strong>{userName}</strong>
              <span>{roleLabel[role]}</span>
            </div>
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}