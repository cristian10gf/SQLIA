import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import '../styles/CoursesPage.css';

type Course = {
  id: string;
  name: string;
  code: string;
  period: string;
  group: string;
  professorId: string;
};

type CourseForm = {
  name: string;
  code: string;
  period: string;
  group: string;
  professorId: string;
};

type CourseErrors = Partial<Record<keyof CourseForm, string>>;

type FormMode = 'create' | 'edit' | null;

const mockUser = {
  fullName: 'Usuario Demo',
  professorId: 'current-professor-id',
};

const enrolledCourseIds = [
  'c1b2a3d4-0001-4000-9000-000000000001',
  'c1b2a3d4-0002-4000-9000-000000000002',
];

const initialCourses: Course[] = [
  {
    id: 'c1b2a3d4-0001-4000-9000-000000000001',
    name: 'Bases de Datos II',
    code: 'BD2-2026',
    period: '2026-1',
    group: 'Grupo 1',
    professorId: 'professor-001',
  },
  {
    id: 'c1b2a3d4-0002-4000-9000-000000000002',
    name: 'SQL Avanzado',
    code: 'SQL-ADV',
    period: '2026-1',
    group: 'Grupo 2',
    professorId: 'professor-002',
  },
  {
    id: 'c1b2a3d4-0003-4000-9000-000000000003',
    name: 'Optimización de Consultas',
    code: 'OPT-SQL',
    period: '2026-1',
    group: 'Grupo 1',
    professorId: 'professor-003',
  },
  {
    id: 'c1b2a3d4-0004-4000-9000-000000000004',
    name: 'Laboratorio SQL',
    code: 'LAB-SQL',
    period: '2026-1',
    group: 'Grupo 3',
    professorId: 'current-professor-id',
  },
];

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

function createLocalId() {
  return crypto.randomUUID();
}

function getCoursesByRole(role: DashboardRole, courses: Course[]) {
  if (role === 'ADMIN') {
    return courses;
  }

  if (role === 'PROFESSOR') {
    return courses.filter(
      (course) => course.professorId === mockUser.professorId,
    );
  }

  return courses.filter((course) => enrolledCourseIds.includes(course.id));
}

function normalizeText(value: string) {
  return value.trim().toLowerCase();
}

export function CoursesPage() {
  const formSectionRef = useRef<HTMLFormElement | null>(null);
  const detailSectionRef = useRef<HTMLElement | null>(null);

  const [role, setRole] = useState<DashboardRole>('STUDENT');
  const [courses, setCourses] = useState<Course[]>(initialCourses);
  const [searchTerm, setSearchTerm] = useState('');
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [errors, setErrors] = useState<CourseErrors>({});
  const [message, setMessage] = useState('');

  const visibleCourses = useMemo(() => {
    const coursesByRole = getCoursesByRole(role, courses);
    const search = normalizeText(searchTerm);

    if (!search) {
      return coursesByRole;
    }

    return coursesByRole.filter((course) => {
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
  }, [courses, role, searchTerm]);

  const canCreateCourse = role === 'PROFESSOR';
  const canManageCourse = role === 'ADMIN' || role === 'PROFESSOR';

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
    setForm({
      ...emptyForm,
      professorId: mockUser.professorId,
    });
    setErrors({});
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
    setSelectedCourse(null);
    setFormMode(null);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    if (formMode === 'create') {
      const newCourse: Course = {
        id: createLocalId(),
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        period: form.period.trim(),
        group: form.group.trim(),
        professorId: form.professorId.trim(),
      };

      setCourses((currentCourses) => [newCourse, ...currentCourses]);
      setMessage('Curso creado correctamente en la vista local.');
      closeForm();
      return;
    }

    if (formMode === 'edit' && selectedCourse) {
      const updatedCourse: Course = {
        ...selectedCourse,
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        period: form.period.trim(),
        group: form.group.trim(),
        professorId: form.professorId.trim(),
      };

      setCourses((currentCourses) =>
        currentCourses.map((course) =>
          course.id === selectedCourse.id ? updatedCourse : course,
        ),
      );

      setMessage('Curso actualizado correctamente en la vista local.');
      closeForm();
    }
  };

  const handleDelete = (courseId: string) => {
    const shouldDelete = window.confirm(
      '¿Seguro que deseas eliminar este curso de la vista local?',
    );

    if (!shouldDelete) {
      return;
    }

    setCourses((currentCourses) =>
      currentCourses.filter((course) => course.id !== courseId),
    );

    if (detailCourse?.id === courseId) {
      setDetailCourse(null);
    }

    setMessage('Curso eliminado correctamente de la vista local.');
  };

  const handleViewChallenges = () => {
    setMessage('La pantalla de retos SQL se implementará en el siguiente paso.');
  };

  return (
    <DashboardLayout role={role} userName={mockUser.fullName}>
      <section className="courses-role-switcher">
        <div>
          <span>Vista temporal por rol</span>
          <p>
            Este selector es provisional mientras el rol real llega desde el
            inicio de sesión.
          </p>
        </div>

        <select
          value={role}
          onChange={(event) => {
            setRole(event.target.value as DashboardRole);
            setFormMode(null);
            setDetailCourse(null);
            setMessage('');
          }}
        >
          <option value="STUDENT">Estudiante</option>
          <option value="PROFESSOR">Profesor</option>
          <option value="ADMIN">Administrador</option>
        </select>
      </section>

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
                  onChange={(event) => handleChange('group', event.target.value)}
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

            <button type="submit" className="course-submit-button">
              {formMode === 'create' ? 'Guardar curso' : 'Guardar cambios'}
            </button>
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
                <span>ID</span>
                <strong>{detailCourse.id}</strong>
              </div>

              <div>
                <span>Código</span>
                <strong>{detailCourse.code}</strong>
              </div>

              <div>
                <span>Periodo</span>
                <strong>{detailCourse.period}</strong>
              </div>

              <div>
                <span>Grupo</span>
                <strong>{detailCourse.group}</strong>
              </div>

              <div>
                <span>ID del profesor</span>
                <strong>{detailCourse.professorId}</strong>
              </div>
            </div>
          </article>
        )}

        <div className="courses-list">
          {visibleCourses.map((course) => (
            <article className="course-card" key={course.id}>
              <div className="course-card-main">
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
                    <button type="button" onClick={() => openEditForm(course)}>
                      Editar curso
                    </button>

                    <button
                      type="button"
                      className="danger-action"
                      onClick={() => handleDelete(course.id)}
                    >
                      Eliminar curso
                    </button>
                  </>
                )}

                {role === 'PROFESSOR' && (
                  <button type="button" onClick={handleViewChallenges}>
                    Crear reto
                  </button>
                )}

                {role === 'STUDENT' && (
                  <button type="button" onClick={handleViewChallenges}>
                    Ver retos
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>

        {visibleCourses.length === 0 && (
          <div className="courses-empty-state">
            <h2>No hay cursos para mostrar</h2>
            <p>
              Ajusta la búsqueda o cambia el rol temporal para revisar otra
              vista.
            </p>
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}