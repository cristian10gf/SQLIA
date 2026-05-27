import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authStorage } from '../../../auth/infrastructure/authStorage';
import { DashboardLayout } from '../../../../shared/layouts/DashboardLayout';
import type { DashboardRole } from '../../../../shared/layouts/DashboardLayout';
import { courseApi } from '../../infrastructure/courseApi';
import { enrollmentApi } from '../../infrastructure/enrollmentApi';
import type { Course, CourseListResponse } from '../../domain/course.types';
import type { BulkEnrollResult, StudentInCourse } from '../../domain/enrollment.types';
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

const STUDENTS_LIMIT = 10;

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

function formatBulkEnrollSummary(result: BulkEnrollResult) {
  const parts = [
    `${result.enrolled} inscrito(s)`,
    `${result.alreadyEnrolled} ya inscrito(s)`,
    `${result.notFound} no encontrado(s)`,
  ];

  if (result.notStudentRole > 0) {
    parts.push(`${result.notStudentRole} sin rol estudiante`);
  }

  if (result.duplicateEmailsInCsv > 0) {
    parts.push(`${result.duplicateEmailsInCsv} correo(s) duplicado(s) en el CSV`);
  }

  return parts.join(' · ');
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
  const [importTargetCourseId, setImportTargetCourseId] = useState<string | null>(
    null,
  );
  const [importFileName, setImportFileName] = useState('');
  const [importResult, setImportResult] = useState<BulkEnrollResult | null>(null);
  const [loadError, setLoadError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [courseStudents, setCourseStudents] = useState<StudentInCourse[]>([]);
  const [studentsPage, setStudentsPage] = useState(1);
  const [studentsTotal, setStudentsTotal] = useState(0);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const canCreateCourse = role === 'PROFESSOR';
  const canManageCourse = role === 'ADMIN' || role === 'PROFESSOR';

  const studentsTotalPages = Math.ceil(studentsTotal / STUDENTS_LIMIT);

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

  const loadStudents = useCallback(
    async (courseId: string, page: number) => {
      if (!token) return;
      setIsLoadingStudents(true);
      try {
        const res = await enrollmentApi.getStudentsByCourse(courseId, token, page);
        setCourseStudents(res.data);
        setStudentsTotal(res.total);
      } catch {
        setCourseStudents([]);
        setStudentsTotal(0);
      } finally {
        setIsLoadingStudents(false);
      }
    },
    [token],
  );

  useEffect(() => {
    if (!detailCourse || !canManageCourse) return;
    void loadStudents(detailCourse.id, studentsPage);
  }, [detailCourse, studentsPage, canManageCourse, loadStudents]);

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
    setImportResult(null);
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
    setCourseStudents([]);
    setStudentsPage(1);
    setStudentsTotal(0);
    scrollToDetail();
  };

  const closeDetail = () => {
    setDetailCourse(null);
    setCourseStudents([]);
    setStudentsPage(1);
    setStudentsTotal(0);
  };

  const closeForm = () => {
    setForm(emptyForm);
    setErrors({});
    setImportFileName('');
    setImportResult(null);
    setSelectedCourse(null);
    setFormMode(null);
  };

  const handleOpenStudentsImport = (courseId: string) => {
    setImportTargetCourseId(courseId);
    setImportResult(null);
    setMessage('');
    studentsImportInputRef.current?.click();
  };

  const handleStudentsImportChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || !importTargetCourseId) {
      return;
    }

    const isCsvFile = file.name.toLowerCase().endsWith('.csv');

    if (!isCsvFile) {
      setImportFileName('');
      setMessage('Solo se permiten archivos .csv exportados desde Brightspace.');
      return;
    }

    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    try {
      setIsImporting(true);
      setImportFileName(file.name);
      setMessage('');
      setImportResult(null);

      const response = await enrollmentApi.bulkEnrollFromCsv(
        importTargetCourseId,
        file,
        token,
      );

      setImportResult(response.data);
      setMessage(
        `${response.message}: ${formatBulkEnrollSummary(response.data)}`,
      );
    } catch (error) {
      setImportFileName('');
      setImportResult(null);
      setMessage(
        error instanceof Error
          ? error.message
          : 'No fue posible importar estudiantes desde el CSV.',
      );
    } finally {
      setIsImporting(false);
      setImportTargetCourseId(null);
    }
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

        <input
          ref={studentsImportInputRef}
          type="file"
          accept=".csv,text/csv"
          className="course-import-input"
          onChange={(event) => void handleStudentsImportChange(event)}
        />

        {importResult && (
          <article className="course-import-result-card">
            <div className="course-import-result-header">
              <div>
                <span>Resultado de importación</span>
                <h2>Resumen de inscripciones</h2>
              </div>
              {importFileName && (
                <p className="course-import-file-name">
                  Archivo: <strong>{importFileName}</strong>
                </p>
              )}
            </div>

            <div className="course-import-result-grid">
              <div>
                <span>Filas en CSV</span>
                <strong>{importResult.totalRowsInCsv}</strong>
              </div>
              <div>
                <span>Correos únicos</span>
                <strong>{importResult.uniqueEmailsInCsv}</strong>
              </div>
              <div>
                <span>Inscritos</span>
                <strong>{importResult.enrolled}</strong>
              </div>
              <div>
                <span>Ya inscritos</span>
                <strong>{importResult.alreadyEnrolled}</strong>
              </div>
              <div>
                <span>No encontrados</span>
                <strong>{importResult.notFound}</strong>
              </div>
              <div>
                <span>Sin rol estudiante</span>
                <strong>{importResult.notStudentRole}</strong>
              </div>
            </div>

            {importResult.notFoundEmails.length > 0 && (
              <div className="course-import-result-list">
                <span>Correos no registrados</span>
                <p>{importResult.notFoundEmails.join(', ')}</p>
              </div>
            )}

            {importResult.notStudentEmails.length > 0 && (
              <div className="course-import-result-list">
                <span>Correos sin rol estudiante</span>
                <p>{importResult.notStudentEmails.join(', ')}</p>
              </div>
            )}
          </article>
        )}

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
            </div>
          </form>
        )}

        {detailCourse && (
          <article ref={detailSectionRef} className="course-detail-card">
            <div className="course-form-header">
              <div>
                <span>Detalle del curso</span>
                <h2>{detailCourse.name}</h2>
              </div>

              <button type="button" onClick={closeDetail}>
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

            {canManageCourse && (
              <div className="course-form-actions">
                <button
                  type="button"
                  className="course-import-button"
                  disabled={isImporting}
                  onClick={() => handleOpenStudentsImport(detailCourse.id)}
                >
                  {isImporting ? 'Importando estudiantes...' : 'Importar estudiantes (CSV)'}
                </button>
              </div>
            )}

            <p className="course-import-hint">
              Usa un CSV UTF-8 exportado desde Brightspace: Groups → categoría
              de grupos → Export → All Groups. Debe incluir la columna{' '}
              <strong>Email Address</strong>.
            </p>

            {canManageCourse && (
              <div className="course-students-section">
                <span>Estudiantes inscritos</span>

                {isLoadingStudents && (
                  <p className="course-students-status">Cargando estudiantes...</p>
                )}

                {!isLoadingStudents && courseStudents.length === 0 && (
                  <p className="course-students-status">
                    No hay estudiantes inscritos en este curso.
                  </p>
                )}

                {!isLoadingStudents && courseStudents.length > 0 && (
                  <>
                    <div className="course-students-list">
                      {courseStudents.map((item) => (
                        <div key={item.student.id} className="course-student-row">
                          <strong>{item.student.fullName}</strong>
                          <p>{item.student.email}</p>
                        </div>
                      ))}
                    </div>

                    {studentsTotalPages > 1 && (
                      <div className="course-students-pagination">
                        <button
                          type="button"
                          disabled={studentsPage === 1}
                          onClick={() => setStudentsPage((p) => p - 1)}
                        >
                          Anterior
                        </button>
                        <p>Página {studentsPage} de {studentsTotalPages}</p>
                        <button
                          type="button"
                          disabled={studentsPage >= studentsTotalPages}
                          onClick={() => setStudentsPage((p) => p + 1)}
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
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
                        disabled={isImporting}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenStudentsImport(course.id);
                        }}
                      >
                        {isImporting ? 'Importando...' : 'Importar CSV'}
                      </button>

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