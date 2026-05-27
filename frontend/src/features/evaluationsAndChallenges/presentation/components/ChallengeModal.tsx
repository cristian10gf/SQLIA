import { useEffect, useState } from 'react';
import type {
  Challenge,
  ChallengeStatus,
  Difficulty,
} from '../../domain/evaluationChallenge.types';
import { challengeApi } from '../../infrastructure/challengeApi';
import { evaluationChallengeApi } from '../../infrastructure/evaluationChallengeApi';
import { emptyChallenge } from '../utils/evaluationUtils';
import '../styles/EvaluationsAndChallengesPage.css';
import { GenerateChallengeModal } from './GenerateChallengeModal';

interface ChallengeModalProps {
  challenge?: Challenge | null;
  evaluationId: number | string;
  courseId: string;
  token: string;
  challengeCount: number;
  onSave: () => void;
  onClose: () => void;
}

type ChallengeFormData = Omit<Challenge, 'id'>;
type InvalidField = keyof ChallengeFormData | null;

export function ChallengeModal({
  challenge,
  evaluationId,
  courseId,
  token,
  challengeCount,
  onSave,
  onClose,
}: ChallengeModalProps) {
  const isEditing = Boolean(challenge);

  const [form, setForm] = useState<ChallengeFormData>(() =>
    challenge
      ? {
          title: challenge.title || '',
          description: challenge.description || '',
          difficulty: challenge.difficulty || 'EASY',
          databaseEngine: challenge.databaseEngine || 'PostgreSQL',
          timeLimitMs: challenge.timeLimitMs || 2000,
          visibility: challenge.visibility || 'PUBLIC',
          points: challenge.points || 10,
          schemaDefinition:
            challenge.schemaDefinition || emptyChallenge.schemaDefinition,
          seedScript: challenge.seedScript || emptyChallenge.seedScript,
          expectedResult:
            typeof challenge.expectedResult === 'string'
              ? challenge.expectedResult
              : JSON.stringify(challenge.expectedResult || '', null, 2),
        }
      : { ...emptyChallenge, expectedResult: '' },
  );
  const [error, setError] = useState('');
  const [invalidField, setInvalidField] = useState<InvalidField>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showGenerateChallenge, setShowGenerateChallenge] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleChange = (
    field: keyof ChallengeFormData,
    value: string | number | Difficulty | ChallengeStatus,
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
    if (invalidField === field) setInvalidField(null);
  };

  const validate = (): { error: string; field: InvalidField } => {
    if (!form.title.trim())
      return { error: 'El título del reto es obligatorio.', field: 'title' };
    if (!form.description.trim())
      return {
        error: 'La descripción del reto es obligatoria.',
        field: 'description',
      };
    if (!form.databaseEngine.trim())
      return {
        error: 'El motor de base de datos es obligatorio.',
        field: 'databaseEngine',
      };
    if (!form.timeLimitMs || form.timeLimitMs < 500)
      return {
        error: 'El límite de ejecución debe ser mínimo 500 ms.',
        field: 'timeLimitMs',
      };
    if (!form.points || form.points < 1)
      return {
        error: 'Los puntos deben ser mayores o iguales a 1.',
        field: 'points',
      };
    return { error: '', field: null };
  };

  const parseExpectedResult = () => {
    const raw = form.expectedResult;
    if (!raw || typeof raw !== 'string') return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  };

  const handleSave = async () => {
    const { error: validationError, field } = validate();
    if (validationError) {
      setError(validationError);
      setInvalidField(field);
      return;
    }

    setIsSaving(true);
    try {
      const { points, ...challengeData } = form;
      const payload = {
        ...challengeData,
        expectedResult: parseExpectedResult(),
        courseId,
        timeLimitMs: Number(form.timeLimitMs),
      };

      if (isEditing && challenge) {
        await challengeApi.update(challenge.id.toString(), payload, token);
        await evaluationChallengeApi.updateAssociation(
          evaluationId.toString(),
          challenge.id.toString(),
          { points: Number(points) },
          token,
        );
      } else {
        console.log(payload);
        const res: any = await challengeApi.create(payload, token);
        const created = res?.data || res;
        await evaluationChallengeApi.associate(
          {
            evaluationId: evaluationId.toString(),
            challengeId: created.id,
            points: Number(points),
            orderIndex: challengeCount + 1,
          },
          token,
        );
      }
      onSave();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudo guardar el reto.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const toggleAiSuggestionBox = () => {
    setShowGenerateChallenge(!showGenerateChallenge);
  };

  const fieldClass = (field: keyof ChallengeFormData) =>
    invalidField === field ? 'eval-field-invalid' : '';

  return (
    <div
      className="eval-modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section className="eval-modal eval-modal-lg">
        <div className="eval-modal-header">
          <div>
            <span className="eval-page-eyebrow">
              {isEditing ? 'EDITAR RETO' : 'NUEVO RETO'}
            </span>
            <h2>{isEditing ? 'Editar reto SQL' : 'Agregar reto SQL'}</h2>
          </div>
          <button
            type="button"
            className="eval-modal-close"
            onClick={onClose}
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="eval-modal-body">
          {error && (
            <div
              className="eval-challenge-error-banner"
              style={{ marginBottom: 16 }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>

        <div className="eval-form-grid">
          <div className="eval-form-group full">
            <label>
              Título del reto
              {invalidField === 'title' && (
                <span className="eval-field-error-label"> — obligatorio</span>
              )}
            </label>
            <input
              className={fieldClass('title')}
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Ej: Consultar clientes por ciudad"
            />
          </div>

          <div className="eval-form-group full">
            <label>
              Descripción del reto
              {invalidField === 'description' && (
                <span className="eval-field-error-label"> — obligatoria</span>
              )}
            </label>
            <textarea
              className={fieldClass('description')}
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Describe lo que debe resolver el estudiante..."
            />
          </div>

          <div className="eval-form-group">
            <label>Dificultad</label>
            <select
              value={form.difficulty}
              onChange={(e) =>
                handleChange('difficulty', e.target.value as Difficulty)
              }
            >
              <option value="EASY">Fácil</option>
              <option value="MEDIUM">Media</option>
              <option value="HARD">Difícil</option>
            </select>
          </div>

          <div className="eval-form-group">
            <label>Visibilidad</label>
            <select
              value={form.visibility}
              onChange={(e) =>
                handleChange('visibility', e.target.value as ChallengeStatus)
              }
            >
              <option value="PUBLIC">Público</option>
              <option value="PRIVATE">Privado</option>
              <option value="ARCHIVED">Archivado</option>
            </select>
          </div>

          <div className="eval-form-group">
            <label>
              Motor de base de datos
              {invalidField === 'databaseEngine' && (
                <span className="eval-field-error-label"> — obligatorio</span>
              )}
            </label>
            <input
              className={fieldClass('databaseEngine')}
              value={form.databaseEngine}
              onChange={(e) => handleChange('databaseEngine', e.target.value)}
            />
          </div>

          <div className="eval-form-group">
            <label>
              Límite de ejecución (ms)
              {invalidField === 'timeLimitMs' && (
                <span className="eval-field-error-label"> — mín. 500 ms</span>
              )}
            </label>
            <input
              type="number"
              min={500}
              className={fieldClass('timeLimitMs')}
              value={form.timeLimitMs}
              onChange={(e) =>
                handleChange('timeLimitMs', Number(e.target.value))
              }
            />
          </div>

          <div className="eval-form-group">
            <label>
              Puntos
              {invalidField === 'points' && (
                <span className="eval-field-error-label"> — mín. 1</span>
              )}
            </label>
            <input
              type="number"
              min={1}
              className={fieldClass('points')}
              value={form.points}
              onChange={(e) => handleChange('points', Number(e.target.value))}
            />
          </div>

          <div className="eval-form-group full">
            <label>Esquema SQL</label>
            <textarea
              className="eval-code-textarea"
              value={form.schemaDefinition}
              onChange={(e) => handleChange('schemaDefinition', e.target.value)}
            />
          </div>

          <div className="eval-form-group full">
            <label>Datos iniciales</label>
            <textarea
              className="eval-code-textarea"
              value={form.seedScript}
              onChange={(e) => handleChange('seedScript', e.target.value)}
            />
          </div>

          <div className="eval-form-group full">
            <label>Resultado esperado (JSON o texto)</label>
            <textarea
              className="eval-code-textarea"
              value={
                typeof form.expectedResult === 'string'
                  ? form.expectedResult
                  : JSON.stringify(form.expectedResult || '', null, 2)
              }
              onChange={(e) => handleChange('expectedResult', e.target.value)}
            />
          </div>
        </div>

        <div className="eval-modal-footer">
          <button
            type="button"
            className="eval-ai-btn"
            onClick={toggleAiSuggestionBox}
          >
            Sugerencia IA
          </button>
          <button
            type="button"
            className="eval-secondary-btn"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="eval-primary-btn"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving
              ? isEditing
                ? 'Guardando...'
                : 'Agregando...'
              : isEditing
                ? 'Guardar reto'
                : 'Agregar reto'}
          </button>
        </div>
      </section>
      {showGenerateChallenge && (
        <GenerateChallengeModal
          setForm={setForm}
          setShowGenerateChallenge={setShowGenerateChallenge}
          token={token}
        ></GenerateChallengeModal>
      )}
    </div>
  );
}
