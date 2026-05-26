import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import { courseApi } from '../../infrastructure/courseApi';
import type { Course, CourseListResponse } from '../../domain/course.types';
import '../styles/CoursesPage.css';

type CourseForm = {
  name: string;
  code: string;
  period: string;
  group: string;
  professorId: string;
};

type CourseErrors = Partial<Record<keyof CourseForm, string>>;

type FormMode = 'create' | 'edit' | null;

const emptyForm: CourseForm = {
  name: '',
  code: '',
  period: '',
  group: '',
  professorId: '',
};

const roleTitle: Record<DashboardRole, string> = {
  ADMIN: 'Gestión general de cursos',
  PROFESSOR: 'Mis cursos asignados',
  STUDENT: 'Mis cursos inscritos',
};

function normalizeCourseList(response: CourseListResponse): Course[] {
  if (Array.isArray(response)) {
    return response;
  }

  if (response && Array.isArray(response.data)) {
    return response.data;
  }

  return [];
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function CoursesPage() {
  const navigate = useNavigate();
  const formSectionRef = useRef<HTMLFormElement | null>(null);
  const detailSectionRef = useRef<HTMLElement | null>(null);
  const studentsImportInputRef = useRef<HTMLInputElement | null>(null);

  const [session] = useState(() => ({
    token: authStorage.getToken(),
    user: authStorage.getUser(),
  }));

  const token = session.token;
  const user = session.user;
  const role = user?.role as DashboardRole | undefined;

  const [courses, setCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [errors, setErrors] = useState<CourseErrors>({});
  const [message, setMessage] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const canCreateCourse = role === 'PROFESSOR';
  const canManageCourse = role === 'ADMIN' || role === 'PROFESSOR';

  useEffect(() => {
    if (!token || !user) {
      navigate('/login', { replace: true });
    }
  }, [navigate, token, user]);

  const loadCourses = useCallback(async () => {
    if (!token || !user || !role) {
      return;
    }

    try {
      setIsLoading(true);
      setLoadError('');

      let response: CourseListResponse;

      if (role === 'ADMIN') {
        response = await courseApi.findAll(token);
        setCourses(normalizeCourseList(response));
        return;
      }

      if (role === 'PROFESSOR') {
        response = await courseApi.findAll(token);

        const professorCourses = normalizeCourseList(response).filter(
          (course) => course.professorId === user.id,
        );

        setCourses(professorCourses);
        return;
      }

      response = await courseApi.findByStudent(user.id, token);
      setCourses(normalizeCourseList(response));
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? error.message
          : 'No fue posible cargar los cursos.',
      );
    } finally {
      setIsLoading(false);
    }
  }, [role, token, user?.id]);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const visibleCourses = useMemo(() => {
    const search = normalizeText(searchTerm);

    if (!search) {
      return courses;
    }

    return courses.filter((course) => {
      const searchableText = [
        course.name,
        course.code,
        course.period,
        course.group,
        course.professorId,
      ]
        .join(' ')
        .toLowerCase();

      return searchableText.includes(search);
    });
  }, [courses, searchTerm]);

  const scrollToForm = () => {
    window.setTimeout(() => {
      formSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  const scrollToDetail = () => {
    window.setTimeout(() => {
      detailSectionRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 0);
  };

  const validateForm = () => {
    const newErrors: CourseErrors = {};

    const name = form.name.trim();
    const code = form.code.trim();
    const period = form.period.trim();
    const group = form.group.trim();
    const professorId = form.professorId.trim();

    if (!name) {
      newErrors.name = 'El nombre del curso es obligatorio.';
    } else if (name.length < 3) {
      newErrors.name = 'El nombre debe tener mínimo 3 caracteres.';
    }

    if (!code) {
      newErrors.code = 'El código del curso es obligatorio.';
    } else if (/\s/.test(code)) {
      newErrors.code = 'El código no debe contener espacios.';
    }

    if (!period) {
      newErrors.period = 'El periodo es obligatorio.';
    } else if (!/^\d{4}-\d$/.test(period)) {
      newErrors.period = 'Usa el formato 2026-1.';
    }

    if (!group) {
      newErrors.group = 'El grupo es obligatorio.';
    }

    if (!professorId) {
      newErrors.professorId = 'El ID del profesor es obligatorio.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof CourseForm, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));

    setMessage('');
  };

  const openCreateForm = () => {
    if (!user) {
      return;
    }

    setForm({
      ...emptyForm,
      professorId: user.id,
    });
    setErrors({});
    setImportFileName('');
    setSelectedCourse(null);
    setDetailCourse(null);
    setFormMode('create');
    setMessage('');
    scrollToForm();
  };

  const openEditForm = (course: Course) => {
    setForm({
      name: course.name,
      code: course.code,
      period: course.period,
      group: course.group,
      professorId: course.professorId,
    });
    setErrors({});
    setImportFileName('');
    setSelectedCourse(course);
    setDetailCourse(null);
    setFormMode('edit');
    setMessage('');
    scrollToForm();
  };

  const openDetail = (course: Course) => {
    setDetailCourse(course);
    setFormMode(null);
    setSelectedCourse(null);
    setErrors({});
    setMessage('');
    scrollToDetail();
  };

  const closeForm = () => {
    setForm(emptyForm);
    setErrors({});
    setImportFileName('');
    setSelectedCourse(null);
    setFormMode(null);
  };

  const handleOpenStudentsImport = () => {
    studentsImportInputRef.current?.click();
  };

  const handleStudentsImportChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const isCsvFile = file.name.toLowerCase().endsWith('.csv');

    if (!isCsvFile) {
      event.target.value = '';
      setImportFileName('');
      setMessage('Solo se permiten archivos .csv para importar estudiantes.');
      return;
    }

    setImportFileName(file.name);
    setMessage(
      `Archivo "${file.name}" seleccionado para importar estudiantes.`,
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      period: form.period.trim(),
      group: form.group.trim(),
      professorId: form.professorId.trim(),
    };

    try {
      setIsSaving(true);
      setMessage('');

      if (formMode === 'create') {
        await courseApi.create(payload, token);
        setMessage('Curso creado correctamente.');
      }

      if (formMode === 'edit' && selectedCourse) {
        await courseApi.update(selectedCourse.id, payload, token);
        setMessage('Curso actualizado correctamente.');
      }

      closeForm();
      await loadCourses();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No fue posible guardar el curso.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    const shouldDelete = window.confirm(
      '¿Seguro que deseas eliminar este curso?',
    );

    if (!shouldDelete) {
      return;
    }

    try {
      await courseApi.remove(courseId, token);

      if (detailCourse?.id === courseId) {
        setDetailCourse(null);
      }

      setMessage('Curso eliminado correctamente.');
      await loadCourses();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'No fue posible eliminar el curso.',
      );
    }
  };

  const handleLogout = () => {
    authStorage.clearSession();
    navigate('/login', { replace: true });
  };

  if (!token || !user || !role) {
    return null;
  }

  return (
    <DashboardLayout
      role={role}
      userName={user.fullName}
      onLogout={handleLogout}
    >
      <section className="courses-page">
        <div className="courses-header">
          <div>
            <span>Cursos</span>
            <h1>{roleTitle[role]}</h1>
          </div>

          {canCreateCourse && (
            <button
              type="button"
              className="primary-action"
              onClick={openCreateForm}
            >
              Crear curso
            </button>
          )}
        </div>

        {message && <p className="courses-message">{message}</p>}
        {loadError && <p className="courses-error-message">{loadError}</p>}

        <div className="courses-toolbar">
          <input
            type="search"
            placeholder="Buscar por nombre, código, periodo, grupo o profesor..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
          />
        </div>

        <div className="courses-summary-grid">
          <article className="course-summary-card">
            <span>Total cursos</span>
            <strong>{visibleCourses.length}</strong>
          </article>
        </div>

        {formMode && (
          <form
            ref={formSectionRef}
            className="course-form-card"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="course-form-header">
              <div>
                <span>
                  {formMode === 'create' ? 'Nuevo curso' : 'Editar curso'}
                </span>
                <h2>
                  {formMode === 'create'
                    ? 'Crear curso'
                    : `Editar ${selectedCourse?.code}`}
                </h2>
              </div>

              <button type="button" onClick={closeForm}>
                Cancelar
              </button>
            </div>

            <div className="course-form-grid">
              <div className="course-form-group">
                <label htmlFor="name">Nombre</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Bases de Datos II"
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  className={errors.name ? 'input-error' : ''}
                />
                {errors.name && (
                  <span className="course-error">{errors.name}</span>
                )}
              </div>

              <div className="course-form-group">
                <label htmlFor="code">Código</label>
                <input
                  id="code"
                  type="text"
                  placeholder="BD2-2026"
                  value={form.code}
                  onChange={(event) => handleChange('code', event.target.value)}
                  className={errors.code ? 'input-error' : ''}
                />
                {errors.code && (
                  <span className="course-error">{errors.code}</span>
                )}
              </div>

              <div className="course-form-group">
                <label htmlFor="period">Periodo</label>
                <input
                  id="period"
                  type="text"
                  placeholder="2026-1"
                  value={form.period}
                  onChange={(event) =>
                    handleChange('period', event.target.value)
                  }
                  className={errors.period ? 'input-error' : ''}
                />
                {errors.period && (
                  <span className="course-error">{errors.period}</span>
                )}
              </div>

              <div className="course-form-group">
                <label htmlFor="group">Grupo</label>
                <input
                  id="group"
                  type="text"
                  placeholder="Grupo 1"
                  value={form.group}
                  onChange={(event) =>
                    handleChange('group', event.target.value)
                  }
                  className={errors.group ? 'input-error' : ''}
                />
                {errors.group && (
                  <span className="course-error">{errors.group}</span>
                )}
              </div>

              <div className="course-form-group course-form-full">
                <label htmlFor="professorId">ID del profesor</label>
                <input
                  id="professorId"
                  type="text"
                  placeholder="professor-123"
                  value={form.professorId}
                  onChange={(event) =>
                    handleChange('professorId', event.target.value)
                  }
                  className={errors.professorId ? 'input-error' : ''}
                  disabled={role === 'PROFESSOR'}
                />
                {errors.professorId && (
                  <span className="course-error">{errors.professorId}</span>
                )}
              </div>
            </div>

            <div className="course-form-actions">
              <button
                type="submit"
                className="course-submit-button"
                disabled={isSaving}
              >
                {isSaving
                  ? 'Guardando...'
                  : formMode === 'create'
                    ? 'Guardar curso'
                    : 'Guardar cambios'}
              </button>

              {formMode === 'create' && (
                <>
                  <input
                    ref={studentsImportInputRef}
                    type="file"
                    accept=".csv,text/csv"
                    className="course-import-input"
                    onChange={handleStudentsImportChange}
                  />

                  <button
                    type="button"
                    className="course-import-button"
                    onClick={handleOpenStudentsImport}
                  >
                    Importar estudiantes
                  </button>
                </>
              )}
            </div>

            {importFileName && (
              <p className="course-import-file-name">
                Archivo seleccionado: <strong>{importFileName}</strong>
              </p>
            )}
          </form>
        )}

        {detailCourse && (
          <article ref={detailSectionRef} className="course-detail-card">
            <div className="course-form-header">
              <div>
                <span>Detalle del curso</span>
                <h2>{detailCourse.name}</h2>
              </div>

              <button type="button" onClick={() => setDetailCourse(null)}>
                Cerrar
              </button>
            </div>

            <div className="course-detail-grid">
              <div>
                <span>Periodo</span>
                <strong>{detailCourse.period}</strong>
              </div>

              <div>
                <span>Grupo</span>
                <strong>{detailCourse.group}</strong>
              </div>
            </div>
          </article>
        )}

        {isLoading && (
          <div className="courses-empty-state">
            <h2>Cargando cursos...</h2>
            <p>Estamos consultando la información.</p>
          </div>
        )}

        {!isLoading && (
          <div className="courses-list">
            {visibleCourses.map((course) => (
              <article className="course-card" key={course.id}>
                <div
                  className="course-card-main"
                  onClick={() =>
                    navigate(`/courses/evaluations-challenges/${course.id}`)
                  }
                  style={{ cursor: 'pointer' }}
                  title="Ver evaluaciones de este curso"
                >
                  <div>
                    <span className="course-code">{course.code}</span>
                    <h2>{course.name}</h2>
                    <p>
                      {course.period} · {course.group}
                    </p>
                  </div>
                </div>

                <div className="course-actions">
                  <button type="button" onClick={() => openDetail(course)}>
                    Ver detalle
                  </button>

                  {canManageCourse && (
                    <>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(course);
                        }}
                      >
                        Editar curso
                      </button>

                      <button
                        type="button"
                        className="danger-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(course.id);
                        }}
                      >
                        Eliminar curso
                      </button>
                    </>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {!isLoading && visibleCourses.length === 0 && (
          <div className="courses-empty-state">
            <h2>No hay cursos para mostrar</h2>
            <p>
              No se encontraron cursos asociados a tu usuario o a la búsqueda
              actual.
            </p>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}