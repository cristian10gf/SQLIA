import { useState } from 'react';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import { AdminDashboard } from '../components/AdminDashboard';
import { ProfessorDashboard } from '../components/ProfessorDashboard';
import { StudentDashboard } from '../components/StudentDashboard';
import '../styles/DashboardPage.css';

const mockUser = {
  fullName: 'Usuario Demo',
};

export function DashboardPage() {
  const [role, setRole] = useState<DashboardRole>('STUDENT');

  const renderDashboardByRole = () => {
    if (role === 'ADMIN') {
      return <AdminDashboard />;
    }

    if (role === 'PROFESSOR') {
      return <ProfessorDashboard />;
    }

    return <StudentDashboard />;
  };

  return (
    <DashboardLayout role={role} userName={mockUser.fullName}>
      <section className="role-switcher">
        <div>
          <span>Vista temporal por rol</span>
          <p>
            Este selector es provisional mientras el rol real llega desde el
            inicio de sesión.
          </p>
        </div>

        <select
          value={role}
          onChange={(event) => setRole(event.target.value as DashboardRole)}
        >
          <option value="STUDENT">Estudiante</option>
          <option value="PROFESSOR">Profesor</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </section>

      {renderDashboardByRole()}
    </DashboardLayout>
  );
}