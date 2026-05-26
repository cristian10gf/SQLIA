import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import { PasswordVisibilityIcon } from '../../../../shared/components/PasswordVisibilityIcon';
import '../styles/ManagemenPage.css';

type UserRole = 'ADMIN' | 'STUDENT' | 'PROFESSOR';
type UserStatus = 'ACTIVE' | 'INACTIVE';

type ManagedUser = {
  id: string;
  fullName: string;
  institutionalEmail: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
};

type ManagementForm = {
  fullName: string;
  institutionalEmail: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
  status: UserStatus;
};

const emptyUserForm: ManagementForm = {
  fullName: '',
  institutionalEmail: '',
  role: 'STUDENT',
  password: '',
  confirmPassword: '',
  status: 'ACTIVE',
};

const initialUsers: ManagedUser[] = [
  {
    id: 'admin-001',
    fullName: 'Administrador SQLIA',
    institutionalEmail: 'admin@uninorte.edu.co',
    role: 'ADMIN',
    status: 'ACTIVE',
    createdAt: '2026-05-01T08:30:00',
  },
  {
    id: 'stu-001',
    fullName: 'Laura Gómez',
    institutionalEmail: 'laura.gomez@uninorte.edu.co',
    role: 'STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-05-03T09:15:00',
  },
  {
    id: 'stu-002',
    fullName: 'Carlos Ruiz',
    institutionalEmail: 'carlos.ruiz@uninorte.edu.co',
    role: 'STUDENT',
    status: 'ACTIVE',
    createdAt: '2026-05-04T10:20:00',
  },
  {
    id: 'prof-001',
    fullName: 'Profesor SQL',
    institutionalEmail: 'profesor.sql@uninorte.edu.co',
    role: 'PROFESSOR',
    status: 'ACTIVE',
    createdAt: '2026-05-02T11:10:00',
  },
  {
    id: 'prof-002',
    fullName: 'Profesor Avanzado',
    institutionalEmail: 'profesor.avanzado@uninorte.edu.co',
    role: 'PROFESSOR',
    status: 'ACTIVE',
    createdAt: '2026-05-05T14:45:00',
  },
];

function normalizeRole(role?: string | null) {
  return String(role || '').toUpperCase();
}

function getRoleLabel(role: UserRole) {
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'PROFESSOR') return 'Profesor';
  return 'Estudiante';
}

function getStatusLabel(status: UserStatus) {
  if (status === 'ACTIVE') return 'Activo';
  return 'Inactivo';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value));
}

function createId(role: UserRole) {
  const prefix =
    role === 'ADMIN' ? 'admin' : role === 'PROFESSOR' ? 'prof' : 'stu';

  return `${prefix}-${Date.now()}`;
}

function validateInstitutionalEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ManagementPage() {
  const navigate = useNavigate();

  const [session] = useState(() => ({
    token: authStorage.getToken(),
    user: authStorage.getUser(),
  }));

  const token = session.token;
  const user = session.user;
  const role = user?.role as DashboardRole | undefined;
  const normalizedRole = normalizeRole(role);
  const isAdmin = normalizedRole === 'ADMIN';

  const [users, setUsers] = useState<ManagedUser[]>(initialUsers);
  const [form, setForm] = useState<ManagementForm>(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'ALL'>('ALL');
  const [formError, setFormError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true });
    }
  }, [navigate, token, user]);

  const visibleUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return users.filter((item) => {
      const matchesRole = roleFilter === 'ALL' || item.role === roleFilter;
      const matchesStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      const matchesSearch =
        !search ||
        item.fullName.toLowerCase().includes(search) ||
        item.institutionalEmail.toLowerCase().includes(search) ||
        getRoleLabel(item.role).toLowerCase().includes(search) ||
        item.id.toLowerCase().includes(search);

      return matchesRole && matchesStatus && matchesSearch;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const resetForm = () => {
    setEditingUserId(null);
    setForm(emptyUserForm);
    setFormError('');
    setActionMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleChange = (field: keyof ManagementForm, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormError('');
    setActionMessage('');
  };

  const validateForm = () => {
    if (!form.fullName.trim()) {
      return 'El nombre completo es obligatorio.';
    }

    if (!form.institutionalEmail.trim()) {
      return 'El correo institucional es obligatorio.';
    }

    if (!validateInstitutionalEmail(form.institutionalEmail)) {
      return 'Ingresa un correo institucional válido.';
    }

    const emailAlreadyExists = users.some((item) => {
      return (
        item.institutionalEmail.trim().toLowerCase() ===
          form.institutionalEmail.trim().toLowerCase() &&
        item.id !== editingUserId
      );
    });

    if (emailAlreadyExists) {
      return 'Ya existe un usuario con ese correo institucional.';
    }

    const isCreating = !editingUserId;

    if (isCreating && !form.password.trim()) {
      return 'La contraseña es obligatoria al crear un usuario.';
    }

    if (isCreating && !form.confirmPassword.trim()) {
      return 'Debes confirmar la contraseña.';
    }

    if (form.password || form.confirmPassword) {
      if (form.password.length < 6) {
        return 'La contraseña debe tener mínimo 6 caracteres.';
      }

      if (form.password !== form.confirmPassword) {
        return 'Las contraseñas no coinciden.';
      }
    }

    return '';
  };

  const handleSave = () => {
    const error = validateForm();

    if (error) {
      setFormError(error);
      return;
    }

    if (editingUserId) {
      setUsers((previous) =>
        previous.map((item) => {
          if (item.id !== editingUserId) return item;

          return {
            ...item,
            fullName: form.fullName.trim(),
            institutionalEmail: form.institutionalEmail.trim(),
            role: form.role,
            status: form.status,
          };
        }),
      );

      setActionMessage('Usuario actualizado correctamente.');
      resetForm();
      return;
    }

    const newUser: ManagedUser = {
      id: createId(form.role),
      fullName: form.fullName.trim(),
      institutionalEmail: form.institutionalEmail.trim(),
      role: form.role,
      status: form.status,
      createdAt: new Date().toISOString(),
    };

    setUsers((previous) => [newUser, ...previous]);
    setActionMessage('Usuario creado correctamente.');
    resetForm();
  };

  const handleEdit = (item: ManagedUser) => {
    setEditingUserId(item.id);
    setForm({
      fullName: item.fullName,
      institutionalEmail: item.institutionalEmail,
      role: item.role,
      password: '',
      confirmPassword: '',
      status: item.status,
    });

    setFormError('');
    setActionMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);

    window.setTimeout(() => {
      document.getElementById('management-form-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  };

  const handleDelete = (item: ManagedUser) => {
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar a ${item.fullName}?`,
    );

    if (!confirmed) return;

    setUsers((previous) =>
      previous.filter((userItem) => userItem.id !== item.id),
    );

    if (editingUserId === item.id) {
      resetForm();
    }

    setActionMessage('Usuario eliminado correctamente.');
  };

  const handleToggleStatus = (item: ManagedUser) => {
    setUsers((previous) =>
      previous.map((userItem) => {
        if (userItem.id !== item.id) return userItem;

        return {
          ...userItem,
          status: userItem.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
        };
      }),
    );

    setActionMessage('Estado actualizado correctamente.');
  };

  const handleLogout = () => {
    authStorage.clearSession();
    navigate('/login', { replace: true });
  };

  if (!token || !user || !role) {
    return null;
  }

  if (!isAdmin) {
    return (
      <DashboardLayout
        role={role}
        userName={user.fullName}
        onLogout={handleLogout}
      >
        <section className="management-page">
          <div className="management-heading">
            <span>Gestión</span>
            <h1>Acceso restringido</h1>
            <p>
              Esta pantalla está reservada únicamente para usuarios con rol
              administrador.
            </p>
          </div>

          <div className="management-empty-state">
            No tienes permisos para gestionar usuarios.
          </div>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      role={role}
      userName={user.fullName}
      onLogout={handleLogout}
    >
      <section className="management-page">
        <div className="management-heading">
          <span>Administración</span>

          <h1>Gestión de usuarios</h1>

          <p>
            Administra estudiantes, profesores y administradores. Puedes crear,
            editar, activar, desactivar y eliminar cuentas.
          </p>
        </div>

        {actionMessage && (
          <div className="management-success-banner">{actionMessage}</div>
        )}

        {formError && (
          <div className="management-error-banner">{formError}</div>
        )}

        <section className="management-workspace">
          <article id="management-form-panel" className="management-form-panel">
            <div className="management-panel-header">
              <div>
                <span>{editingUserId ? 'Editar usuario' : 'Crear usuario'}</span>

                <h2>
                  {editingUserId ? 'Actualizar datos' : 'Nuevo usuario'}
                </h2>

                <p>
                  {editingUserId
                    ? 'Modifica la información del usuario seleccionado.'
                    : 'Completa los datos requeridos para crear una cuenta.'}
                </p>
              </div>
            </div>

            <div className="management-form-grid">
              <div className="management-form-group full">
                <label>Nombre completo</label>
                <input
                  value={form.fullName}
                  onChange={(event) =>
                    handleChange('fullName', event.target.value)
                  }
                  placeholder="Ingresa tu nombre completo"
                />
              </div>

              <div className="management-form-group full">
                <label>Correo institucional</label>
                <input
                  type="email"
                  value={form.institutionalEmail}
                  onChange={(event) =>
                    handleChange('institutionalEmail', event.target.value)
                  }
                  placeholder="usuario@uninorte.edu.co"
                />
              </div>

              <div className="management-form-group full">
                <label>Rol</label>
                <select
                  value={form.role}
                  onChange={(event) =>
                    handleChange('role', event.target.value as UserRole)
                  }
                >
                  <option value="STUDENT">Estudiante</option>
                  <option value="PROFESSOR">Profesor</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div className="management-form-group full">
                <label>
                  Contraseña
                  {editingUserId && <small> Opcional al editar</small>}
                </label>

                <div className="management-password-field">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(event) =>
                      handleChange('password', event.target.value)
                    }
                    placeholder={
                      editingUserId
                        ? 'Escribe una nueva contraseña si deseas cambiarla'
                        : 'Crea una contraseña'
                    }
                  />

                 <button
                    type="button"
                    className="management-password-toggle"
                    onClick={() => setShowPassword((previous) => !previous)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                    <PasswordVisibilityIcon visible={showPassword} />
                    </button>
                </div>
              </div>

              <div className="management-form-group full">
                <label>
                  Confirmar contraseña
                  {editingUserId && <small> Opcional al editar</small>}
                </label>

                <div className="management-password-field">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(event) =>
                      handleChange('confirmPassword', event.target.value)
                    }
                    placeholder={
                      editingUserId
                        ? 'Repite la nueva contraseña'
                        : 'Repite tu contraseña'
                    }
                  />

                  <button
                    type="button"
                    className="management-password-toggle"
                    onClick={() => setShowConfirmPassword((previous) => !previous)}
                    aria-label={
                        showConfirmPassword
                        ? 'Ocultar confirmación de contraseña'
                        : 'Mostrar confirmación de contraseña'
                    }
                    >
                    <PasswordVisibilityIcon visible={showConfirmPassword} />
                    </button>
                </div>
              </div>

              <div className="management-form-group full">
                <label>Estado</label>
                <select
                  value={form.status}
                  onChange={(event) =>
                    handleChange('status', event.target.value as UserStatus)
                  }
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </div>
            </div>

            <div className="management-form-actions">
              <button
                type="button"
                className="management-secondary-btn"
                onClick={resetForm}
              >
                Limpiar
              </button>

              <button
                type="button"
                className="management-primary-btn"
                onClick={handleSave}
              >
                {editingUserId ? 'Guardar cambios' : 'Crear cuenta'}
              </button>
            </div>
          </article>

          <article className="management-list-panel">
            <div className="management-panel-header list-header">
              <div>
                <span>Usuarios registrados</span>

                <h2>Gestión de estudiantes, profesores y administradores</h2>

                <p>
                  Consulta, filtra, edita, activa, desactiva o elimina usuarios
                  registrados en la plataforma.
                </p>
              </div>
            </div>

            <div className="management-list-tools">
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nombre, correo, rol o ID..."
              />

              <select
                value={roleFilter}
                onChange={(event) =>
                  setRoleFilter(event.target.value as UserRole | 'ALL')
                }
              >
                <option value="ALL">Todos los roles</option>
                <option value="STUDENT">Estudiantes</option>
                <option value="PROFESSOR">Profesores</option>
                <option value="ADMIN">Administradores</option>
              </select>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as UserStatus | 'ALL')
                }
              >
                <option value="ALL">Todos los estados</option>
                <option value="ACTIVE">Activos</option>
                <option value="INACTIVE">Inactivos</option>
              </select>
            </div>

            <div className="management-table-wrapper">
              <table className="management-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Correo institucional</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Creado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleUsers.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.fullName}</strong>
                        <span>{item.id}</span>
                      </td>

                      <td>{item.institutionalEmail}</td>

                      <td>
                        <span
                          className={`management-role-badge ${item.role.toLowerCase()}`}
                        >
                          {getRoleLabel(item.role)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`management-status-badge ${item.status.toLowerCase()}`}
                        >
                          {getStatusLabel(item.status)}
                        </span>
                      </td>

                      <td>{formatDate(item.createdAt)}</td>

                      <td>
                        <div className="management-row-actions">
                          <button
                            type="button"
                            className="management-secondary-btn small"
                            onClick={() => handleEdit(item)}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="management-warning-btn small"
                            onClick={() => handleToggleStatus(item)}
                          >
                            {item.status === 'ACTIVE'
                              ? 'Desactivar'
                              : 'Activar'}
                          </button>

                          <button
                            type="button"
                            className="management-danger-btn small"
                            onClick={() => handleDelete(item)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {visibleUsers.length === 0 && (
                <div className="management-empty-state">
                  No se encontraron usuarios para esta búsqueda.
                </div>
              )}
            </div>
          </article>
        </section>
      </section>
    </DashboardLayout>
  );
}

export default ManagementPage;