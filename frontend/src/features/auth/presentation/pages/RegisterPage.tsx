import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PasswordVisibilityIcon } from '../../../../shared/components/PasswordVisibilityIcon';
import type { UserRole } from '../../domain/auth.types';
import { authApi } from '../../infrastructure/authApi';
import { authStorage } from '../../infrastructure/authStorage';
import '../styles/RegisterPage.css';

type RegisterForm = {
  fullName: string;
  email: string;
  role: string;
  password: string;
  confirmPassword: string;
};

type RegisterErrors = {
  fullName?: string;
  email?: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
};

export function RegisterPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<RegisterForm>({
    fullName: '',
    email: '',
    role: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<RegisterErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: RegisterErrors = {};

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();
    const confirmPassword = form.confirmPassword.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const institutionalDomain = '@uninorte.edu.co';

    if (!fullName) {
      newErrors.fullName = 'El nombre completo es obligatorio.';
    } else if (fullName.length < 5) {
      newErrors.fullName = 'El nombre debe tener mínimo 5 caracteres.';
    }

    if (!email) {
      newErrors.email = 'El correo institucional es obligatorio.';
    } else if (/\s/.test(form.email)) {
      newErrors.email = 'El correo no debe contener espacios.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Ingresa un correo electrónico válido.';
    } else if (!email.endsWith(institutionalDomain)) {
      newErrors.email = 'El correo debe pertenecer al dominio @uninorte.edu.co.';
    }

    if (!form.role) {
      newErrors.role = 'Selecciona un rol.';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria.';
    } else if (form.password !== form.password.trim()) {
      newErrors.password =
        'La contraseña no debe iniciar ni terminar con espacios.';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener mínimo 6 caracteres.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirma tu contraseña.';
    } else if (form.confirmPassword !== form.confirmPassword.trim()) {
      newErrors.confirmPassword =
        'La confirmación no debe iniciar ni terminar con espacios.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof RegisterForm, value: string) => {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
      general: undefined,
    }));

    setSuccessMessage('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    try {
      setIsSubmitting(true);
      setErrors({});
      setSuccessMessage('');

      const response = await authApi.register({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role as UserRole,
        password: form.password,
      });

      authStorage.saveSession(response.accessToken, response.user);
      setSuccessMessage(
        `Cuenta creada correctamente. Bienvenido, ${response.user.fullName}.`,
      );

      const role = response.user.role;

      const redirectByRole: Record<string, string> = {
        ADMIN: '/managemen',
        PROFESSOR: '/courses',
        STUDENT: '/courses',
      };

      navigate(redirectByRole[role] ?? '/courses');
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'No fue posible registrar la cuenta.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="register-page">
      <section className="register-hero">
        <div className="brand">
          <div className="brand-logo">SQL</div>

          <div>
            <h1>SQLIA</h1>
            <p>Evaluación inteligente de consultas SQL</p>
          </div>
        </div>

        <div className="hero-content">
          <span className="hero-tag">CREA TU CUENTA</span>
          <h2>Únete a SQLIA y empieza a resolver retos SQL.</h2>
        </div>
      </section>

      <section className="register-section">
        <div className="register-card">
          <div className="register-header">
            <h2>Registrarse</h2>
          </div>

          <form className="register-form" onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="fullName">Nombre completo</label>

              <input
                id="fullName"
                type="text"
                placeholder="Ingresa tu nombre completo"
                value={form.fullName}
                onChange={(event) =>
                  handleChange('fullName', event.target.value)
                }
                className={errors.fullName ? 'input-error' : ''}
              />

              {errors.fullName && (
                <span className="error-message">{errors.fullName}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo institucional</label>

              <input
                id="email"
                type="email"
                placeholder="usuario@uninorte.edu.co"
                value={form.email}
                onChange={(event) => handleChange('email', event.target.value)}
                className={errors.email ? 'input-error' : ''}
              />

              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="role">Rol</label>

              <select
                id="role"
                value={form.role}
                onChange={(event) => handleChange('role', event.target.value)}
                className={errors.role ? 'input-error' : ''}
              >
                <option value="">Selecciona tu rol</option>
                <option value="STUDENT">Estudiante</option>
                <option value="ADMIN">Administrador</option>
                <option value="PROFESSOR">Profesor</option>
              </select>

              {errors.role && (
                <span className="error-message">{errors.role}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>

              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Crea una contraseña"
                  value={form.password}
                  onChange={(event) =>
                    handleChange('password', event.target.value)
                  }
                  className={errors.password ? 'input-error' : ''}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((currentValue) => !currentValue)}
                  aria-label={
                    showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
                  }
                >
                  <PasswordVisibilityIcon visible={showPassword} />
                </button>
              </div>

              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>

              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repite tu contraseña"
                  value={form.confirmPassword}
                  onChange={(event) =>
                    handleChange('confirmPassword', event.target.value)
                  }
                  className={errors.confirmPassword ? 'input-error' : ''}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword((currentValue) => !currentValue)
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                >
                  <PasswordVisibilityIcon visible={showConfirmPassword} />
                </button>
              </div>

              {errors.confirmPassword && (
                <span className="error-message">
                  {errors.confirmPassword}
                </span>
              )}
            </div>

            {errors.general && (
              <p className="error-message">{errors.general}</p>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          {successMessage && (
            <p className="success-message">{successMessage}</p>
          )}

          <div className="register-links">
            <p>
              ¿Ya tienes cuenta? <Link to="/login">Iniciar sesión</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}