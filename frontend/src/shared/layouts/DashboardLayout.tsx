import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import '../styles/DashboardLayout.css';

export type DashboardRole = 'ADMIN' | 'PROFESSOR' | 'STUDENT';

type DashboardLayoutProps = {
  role: DashboardRole;
  userName: string;
  children: ReactNode;
  onLogout: () => void;
};

type MenuItem = {
  label: string;
  path: string;
};

const menuByRole: Record<DashboardRole, MenuItem[]> = {
  ADMIN: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Cursos', path: '/courses' },
    { label: 'Reportes', path: '/dashboard/reports' },
  ],

  PROFESSOR: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Mis cursos', path: '/courses' },
    { label: 'Reportes', path: '/reports' },
    { label: 'Evaluaciones', path: '/evaluation' },
  ],

  STUDENT: [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Mis cursos', path: '/courses' },
    { label: 'Mis resultados', path: '/results' }
  ],
};

const roleLabel: Record<DashboardRole, string> = {
  ADMIN: 'Administrador',
  PROFESSOR: 'Profesor',
  STUDENT: 'Estudiante',
};

function getInitials(name: string) {
  const cleanedName = name.trim();

  if (!cleanedName) {
    return 'US';
  }

  const parts = cleanedName.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function DashboardLayout({
  role,
  userName,
  children,
  onLogout,
}: DashboardLayoutProps) {
  const menuItems = menuByRole[role];
  const avatarText = getInitials(userName);

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
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-navbar">
          <div className="navbar-actions">
            <div className="navbar-user">
              <div className="user-avatar" aria-hidden="true">
                <span className="user-avatar-text">{avatarText}</span>
              </div>

              <div className="user-info">
                <strong>{userName}</strong>
                <span>{roleLabel[role]}</span>
              </div>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={onLogout}
              title="Cerrar sesión"
              aria-label="Cerrar sesión"
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M10 7V5.8C10 4.81 10 4.31 10.2 3.93C10.37 3.6 10.6 3.37 10.93 3.2C11.31 3 11.81 3 12.8 3H17.2C18.19 3 18.69 3 19.07 3.2C19.4 3.37 19.63 3.6 19.8 3.93C20 4.31 20 4.81 20 5.8V18.2C20 19.19 20 19.69 19.8 20.07C19.63 20.4 19.4 20.63 19.07 20.8C18.69 21 18.19 21 17.2 21H12.8C11.81 21 11.31 21 10.93 20.8C10.6 20.63 10.37 20.4 10.2 20.07C10 19.69 10 19.19 10 18.2V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M15 12H4M4 12L7.5 8.5M4 12L7.5 15.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}