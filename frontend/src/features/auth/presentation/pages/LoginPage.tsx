import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PasswordVisibilityIcon } from '../../../../shared/components/PasswordVisibilityIcon';
import { authApi } from '../../infrastructure/authApi';
import { authStorage } from '../../infrastructure/authStorage';
import '../styles/LoginPage.css';

type LoginForm = {
  email: string;
  password: string;
};

type LoginErrors = {
  email?: string;
  password?: string;
  general?: string;
};

export function LoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState<LoginForm>({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState<LoginErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors: LoginErrors = {};

    const email = form.email.trim().toLowerCase();
    const password = form.password.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const institutionalDomain = '@uninorte.edu.co';

    if (!email) {
      newErrors.email = 'El correo electrónico es obligatorio.';
    } else if (/\s/.test(form.email)) {
      newErrors.email = 'El correo electrónico no debe contener espacios.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Ingresa un correo electrónico válido.';
    } else if (!email.endsWith(institutionalDomain)) {
      newErrors.email = 'El correo debe pertenecer al dominio @uninorte.edu.co.';
    }

    if (!password) {
      newErrors.password = 'La contraseña es obligatoria.';
    } else if (form.password !== form.password.trim()) {
      newErrors.password =
        'La contraseña no debe iniciar ni terminar con espacios.';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener mínimo 6 caracteres.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof LoginForm, value: string) => {
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

      const response = await authApi.login({
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      authStorage.saveSession(response.accessToken, response.user);
      setSuccessMessage(`Bienvenido, ${response.user.fullName}.`);
      navigate('/dashboard');
    } catch (error) {
      setErrors({
        general:
          error instanceof Error
            ? error.message
            : 'No fue posible iniciar sesión.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="brand">
          <div className="brand-logo">SQL</div>

          <div>
            <h1>SQLIA</h1>
            <p>Evaluación inteligente de consultas SQL</p>
          </div>
        </div>

        <div className="hero-content">
          <span className="hero-tag">PLATAFORMA ACADÉMICA</span>
          <h2>Evalúa, analiza y optimiza consultas SQL en un solo lugar.</h2>
        </div>
      </section>

      <section className="login-section">
        <div className="login-card">
          <div className="login-header">
            <h2>Iniciar sesión</h2>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
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
              <label htmlFor="password">Contraseña</label>

              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingresa tu contraseña"
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

            {errors.general && (
              <p className="error-message">{errors.general}</p>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Ingresando...' : 'Entrar'}
            </button>
          </form>

          {successMessage && (
            <p className="success-message">{successMessage}</p>
          )}

          <div className="login-links">
            <a href="#" className="forgot-password">
              ¿Olvidaste tu contraseña?
            </a>

            <p>
              ¿No tienes cuenta? <Link to="/register">Registrarse</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}