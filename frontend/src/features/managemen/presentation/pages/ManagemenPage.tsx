import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import { PasswordVisibilityIcon } from '../../../../shared/components/PasswordVisibilityIcon';
import { userApi } from '../../infrastructure/userApi';
import type { ApiUser, ApiUserDetail, ImportCsvResult, UserRole } from '../../infrastructure/userApi';
import '../styles/ManagemenPage.css';

type ManagedUser = {
  id: string;
  fullName: string;
  institutionalEmail: string;
  role: UserRole;
  createdAt: string;
};

type ManagementForm = {
  fullName: string;
  institutionalEmail: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
};

const emptyUserForm: ManagementForm = {
  fullName: '',
  institutionalEmail: '',
  role: 'STUDENT',
  password: '',
  confirmPassword: '',
};

function toManagedUser(user: ApiUser): ManagedUser {
  return {
    id: user.id,
    fullName: user.fullName,
    institutionalEmail: user.email,
    role: user.role,
    createdAt: user.createdAt ?? new Date().toISOString(),
  };
}

function normalizeRole(role?: string | null) {
  return String(role || '').toUpperCase();
}

function getRoleLabel(role: UserRole) {
  if (role === 'ADMIN') return 'Administrador';
  if (role === 'PROFESSOR') return 'Profesor';
  return 'Estudiante';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  }).format(new Date(value));
}

function validateInstitutionalEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ManagementPage() {
  const navigate = useNavigate();
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [session] = useState(() => ({
    token: authStorage.getToken(),
    user: authStorage.getUser(),
  }));

  const token = session.token;
  const user = session.user;
  const role = user?.role as DashboardRole | undefined;
  const normalizedRole = normalizeRole(role);
  const isAdmin = normalizedRole === 'ADMIN';

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [form, setForm] = useState<ManagementForm>(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagedUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [formError, setFormError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  // Detail modal
  const [detailUser, setDetailUser] = useState<ApiUserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  // CSV import
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportCsvResult | null>(null);

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true });
    }
  }, [navigate, token, user]);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setApiError('');
    try {
      const response = await userApi.findAll(token);
      setUsers(response.data.map(toManagedUser));
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : 'Error al cargar los usuarios.',
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin, loadUsers]);

  const visibleUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();
    return users.filter((item) => {
      const matchesRole = roleFilter === 'ALL' || item.role === roleFilter;
      const matchesSearch =
        !search ||
        item.fullName.toLowerCase().includes(search) ||
        item.institutionalEmail.toLowerCase().includes(search) ||
        getRoleLabel(item.role).toLowerCase().includes(search) ||
        item.id.toLowerCase().includes(search);
      return matchesRole && matchesSearch;
    });
  }, [users, searchTerm, roleFilter]);

  const openCreateModal = () => {
    setEditingUserId(null);
    setForm(emptyUserForm);
    setFormError('');
    setActionMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUserId(null);
    setForm(emptyUserForm);
    setFormError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleChange = (field: keyof ManagementForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
    setFormError('');
  };

  const validateForm = () => {
    if (!form.fullName.trim()) return 'El nombre completo es obligatorio.';
    if (!form.institutionalEmail.trim()) return 'El correo institucional es obligatorio.';
    if (!validateInstitutionalEmail(form.institutionalEmail))
      return 'Ingresa un correo institucional válido.';

    const isCreating = !editingUserId;
    if (isCreating && !form.password.trim())
      return 'La contraseña es obligatoria al crear un usuario.';
    if (isCreating && !form.confirmPassword.trim())
      return 'Debes confirmar la contraseña.';

    if (form.password || form.confirmPassword) {
      if (form.password.length < 6)
        return 'La contraseña debe tener mínimo 6 caracteres.';
      if (form.password !== form.confirmPassword)
        return 'Las contraseñas no coinciden.';
    }

    return '';
  };

  const handleSave = async () => {
    const error = validateForm();
    if (error) { setFormError(error); return; }

    setSaving(true);
    setFormError('');

    try {
      if (editingUserId) {
        const payload: { fullName?: string; email?: string; role?: UserRole; password?: string } = {
          fullName: form.fullName.trim(),
          email: form.institutionalEmail.trim(),
          role: form.role,
        };
        if (form.password) payload.password = form.password;

        const response = await userApi.update(editingUserId, payload, token!);
        setUsers((previous) =>
          previous.map((item) =>
            item.id === editingUserId ? toManagedUser(response.data) : item,
          ),
        );
        setActionMessage('Usuario actualizado correctamente.');
      } else {
        if (form.role === 'ADMIN') {
          setFormError(
            'No es posible crear administradores directamente. Crea el usuario y luego edita su rol a Administrador.',
          );
          return;
        }
        const response = await userApi.create({
          fullName: form.fullName.trim(),
          email: form.institutionalEmail.trim(),
          role: form.role as 'PROFESSOR' | 'STUDENT',
          password: form.password,
        });
        setUsers((previous) => [toManagedUser(response.user), ...previous]);
        setActionMessage('Usuario creado correctamente.');
      }
      closeModal();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : 'Ocurrió un error inesperado.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: ManagedUser) => {
    setEditingUserId(item.id);
    setForm({
      fullName: item.fullName,
      institutionalEmail: item.institutionalEmail,
      role: item.role,
      password: '',
      confirmPassword: '',
    });
    setFormError('');
    setActionMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
  };

  const handleDeleteRequest = (item: ManagedUser) => {
    setDeleteTarget(item);
    setApiError('');
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await userApi.remove(deleteTarget.id, token!);
      setUsers((previous) => previous.filter((u) => u.id !== deleteTarget.id));
      setActionMessage('Usuario eliminado correctamente.');
      setDeleteTarget(null);
    } catch (err) {
      setApiError(
        err instanceof Error ? err.message : 'No se pudo eliminar el usuario.',
      );
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const handleRowClick = async (item: ManagedUser) => {
    setDetailUser(null);
    setDetailError('');
    setDetailLoading(true);
    try {
      const res = await userApi.findById(item.id, token!);
      const detail: ApiUserDetail = (res as any)?.data ?? res;
      setDetailUser(detail);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : 'No se pudo cargar el detalle.');
      setDetailUser({ id: item.id, email: item.institutionalEmail, fullName: item.fullName, role: item.role, createdAt: item.createdAt });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setImporting(true);
    setImportResult(null);
    setApiError('');
    try {
      const res: any = await userApi.importCsv(file, token!);
      const result: ImportCsvResult = res?.data ?? res;
      setImportResult(result);
      setActionMessage(`Importación completada: ${result.created} creados, ${result.alreadyExisted} ya existían.`);
      await loadUsers();
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Error al importar el CSV.');
    } finally {
      setImporting(false);
    }
  };

  const handleLogout = () => {
    authStorage.clearSession();
    navigate('/login', { replace: true });
  };

  if (!token || !user || !role) return null;

  if (!isAdmin) {
    return (
      <DashboardLayout role={role} userName={user.fullName} onLogout={handleLogout}>
        <section className="management-page">
          <div className="management-heading">
            <span>Gestión</span>
            <h1>Acceso restringido</h1>
            <p>Esta pantalla está reservada únicamente para usuarios con rol administrador.</p>
          </div>
          <div className="management-empty-state">
            No tienes permisos para gestionar usuarios.
          </div>
        </section>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role} userName={user.fullName} onLogout={handleLogout}>
      <section className="management-page">
        <div className="management-heading">
          <span>Administración</span>
          <h1>Gestión de usuarios</h1>
          <p>
            Administra estudiantes, profesores y administradores. Puedes crear,
            editar y eliminar cuentas.
          </p>
        </div>

        {actionMessage && (
          <div className="management-success-banner">{actionMessage}</div>
        )}
        {apiError && (
          <div className="management-error-banner">{apiError}</div>
        )}

        {importResult && (
          <div className="management-import-result">
            <strong>Resultado de importación</strong>
            <ul>
              <li>Total filas procesadas: <strong>{importResult.total}</strong></li>
              <li>Usuarios creados: <strong>{importResult.created}</strong></li>
              <li>Ya existían: <strong>{importResult.alreadyExisted}</strong></li>
              {importResult.errors.length > 0 && (
                <li>Errores: {importResult.errors.join(', ')}</li>
              )}
            </ul>
          </div>
        )}

        <article className="management-list-panel">
          <div className="management-panel-header list-header">
            <div className="management-panel-header-row">
              <div>
                <span>Usuarios registrados</span>
                <h2>Estudiantes, profesores y administradores</h2>
              </div>
              <div className="management-header-actions">
                <input
                  ref={csvInputRef}
                  type="file"
                  accept=".csv"
                  style={{ display: 'none' }}
                  onChange={handleCsvFileChange}
                />
                <button
                  type="button"
                  className="management-secondary-btn"
                  onClick={() => csvInputRef.current?.click()}
                  disabled={importing}
                >
                  {importing ? 'Importando...' : '↑ Importar CSV'}
                </button>
                <button
                  type="button"
                  className="management-primary-btn"
                  onClick={openCreateModal}
                >
                  + Agregar usuario
                </button>
              </div>
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
          </div>

          <div className="management-table-wrapper">
            {loading ? (
              <div className="management-empty-state">Cargando usuarios...</div>
            ) : (
              <>
                <table className="management-table">
                  <thead>
                    <tr>
                      <th>Nombre</th>
                      <th>Correo institucional</th>
                      <th>Rol</th>
                      <th>Creado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleUsers.map((item) => (
                      <tr
                        key={item.id}
                        className="management-table-row-clickable"
                        onClick={() => handleRowClick(item)}
                      >
                        <td>
                          <strong>{item.fullName}</strong>
                          <span>{item.id}</span>
                        </td>
                        <td>{item.institutionalEmail}</td>
                        <td>
                          <span className={`management-role-badge ${item.role.toLowerCase()}`}>
                            {getRoleLabel(item.role)}
                          </span>
                        </td>
                        <td>{formatDate(item.createdAt)}</td>
                        <td>
                          <div className="management-row-actions">
                            <button
                              type="button"
                              className="management-secondary-btn small"
                              onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="management-danger-btn small"
                              onClick={(e) => { e.stopPropagation(); handleDeleteRequest(item); }}
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
              </>
            )}
          </div>
        </article>
      </section>

      {/* ── Detail modal ──────────────────────────────────────────────── */}
      {(detailUser || detailLoading) && (
        <div
          className="management-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) { setDetailUser(null); setDetailError(''); } }}
        >
          <div className="management-modal management-modal--detail">
            <div className="management-modal-header">
              <div>
                <span>DETALLE DE USUARIO</span>
                <h2>{detailUser?.fullName ?? '...'}</h2>
              </div>
              <button
                type="button"
                className="management-modal-close"
                onClick={() => { setDetailUser(null); setDetailError(''); }}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {detailLoading && <div className="management-detail-loading">Cargando información...</div>}
            {detailError && <div className="management-error-banner">{detailError}</div>}

            {detailUser && !detailLoading && (
              <div className="management-detail-body">
                <div className="management-detail-grid">
                  <div className="management-detail-field">
                    <span className="management-detail-label">ID</span>
                    <span className="management-detail-value management-detail-id">{detailUser.id}</span>
                  </div>
                  <div className="management-detail-field">
                    <span className="management-detail-label">Correo</span>
                    <span className="management-detail-value">{detailUser.email}</span>
                  </div>
                  <div className="management-detail-field">
                    <span className="management-detail-label">Rol</span>
                    <span className={`management-role-badge ${detailUser.role.toLowerCase()}`}>
                      {getRoleLabel(detailUser.role)}
                    </span>
                  </div>
                  <div className="management-detail-field">
                    <span className="management-detail-label">Creado</span>
                    <span className="management-detail-value">
                      {detailUser.createdAt ? formatDate(detailUser.createdAt) : '—'}
                    </span>
                  </div>
                </div>

                {detailUser.enrollments && detailUser.enrollments.length > 0 && (
                  <div className="management-detail-section">
                    <h3>Cursos inscritos</h3>
                    <ul className="management-detail-list">
                      {detailUser.enrollments.map((e) => (
                        <li key={e.courseId}>
                          <span>{e.courseName ?? e.courseId}</span>
                          {e.enrolledAt && (
                            <span className="management-detail-sub">{formatDate(e.enrolledAt)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="management-form-actions">
              <button
                type="button"
                className="management-secondary-btn"
                onClick={() => { setDetailUser(null); setDetailError(''); }}
              >
                Cerrar
              </button>
              {detailUser && (
                <button
                  type="button"
                  className="management-primary-btn"
                  onClick={() => {
                    setDetailUser(null);
                    handleEdit({
                      id: detailUser.id,
                      fullName: detailUser.fullName,
                      institutionalEmail: detailUser.email,
                      role: detailUser.role,
                      createdAt: detailUser.createdAt ?? '',
                    });
                  }}
                >
                  Editar usuario
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit modal ───────────────────────────────────────── */}
      {showModal && (
        <div
          className="management-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          <div className="management-modal">
            <div className="management-modal-header">
              <div>
                <span>{editingUserId ? 'Editar usuario' : 'Crear usuario'}</span>
                <h2>{editingUserId ? 'Actualizar datos' : 'Nuevo usuario'}</h2>
                <p>
                  {editingUserId
                    ? 'Modifica la información del usuario seleccionado.'
                    : 'Completa los datos requeridos para crear una cuenta.'}
                </p>
              </div>
              <button
                type="button"
                className="management-modal-close"
                onClick={closeModal}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="management-error-banner">{formError}</div>
            )}

            <div className="management-form-grid">
              <div className="management-form-group full">
                <label>Nombre completo</label>
                <input
                  value={form.fullName}
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  placeholder="Ingresa el nombre completo"
                />
              </div>

              <div className="management-form-group full">
                <label>Correo institucional</label>
                <input
                  type="email"
                  value={form.institutionalEmail}
                  onChange={(e) => handleChange('institutionalEmail', e.target.value)}
                  placeholder="usuario@uninorte.edu.co"
                />
              </div>

              <div className="management-form-group full">
                <label>Rol</label>
                <select
                  value={form.role}
                  onChange={(e) => handleChange('role', e.target.value as UserRole)}
                >
                  <option value="STUDENT">Estudiante</option>
                  <option value="PROFESSOR">Profesor</option>
                  {editingUserId && <option value="ADMIN">Administrador</option>}
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
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder={
                      editingUserId
                        ? 'Escribe una nueva contraseña si deseas cambiarla'
                        : 'Crea una contraseña'
                    }
                  />
                  <button
                    type="button"
                    className="management-password-toggle"
                    onClick={() => setShowPassword((p) => !p)}
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
                    onChange={(e) => handleChange('confirmPassword', e.target.value)}
                    placeholder={
                      editingUserId ? 'Repite la nueva contraseña' : 'Repite tu contraseña'
                    }
                  />
                  <button
                    type="button"
                    className="management-password-toggle"
                    onClick={() => setShowConfirmPassword((p) => !p)}
                    aria-label={showConfirmPassword ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                  >
                    <PasswordVisibilityIcon visible={showConfirmPassword} />
                  </button>
                </div>
              </div>
            </div>

            <div className="management-form-actions">
              <button
                type="button"
                className="management-secondary-btn"
                onClick={closeModal}
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="management-primary-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving
                  ? 'Guardando...'
                  : editingUserId
                    ? 'Guardar cambios'
                    : 'Crear cuenta'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm modal ──────────────────────────────────────── */}
      {deleteTarget && (
        <div
          className="management-modal-overlay"
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setDeleteTarget(null); }}
        >
          <div className="management-modal management-modal--confirm">
            <div className="management-confirm-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                <path d="M10 11v6M14 11v6" />
              </svg>
            </div>

            <div className="management-confirm-body">
              <h2>¿Eliminar usuario?</h2>
              <p>
                Estás a punto de eliminar la cuenta de{' '}
                <strong>{deleteTarget.fullName}</strong>. Esta acción no se
                puede deshacer.
              </p>
              <p className="management-confirm-email">{deleteTarget.institutionalEmail}</p>
            </div>

            <div className="management-form-actions">
              <button
                type="button"
                className="management-secondary-btn"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="management-danger-btn"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default ManagementPage;
