import { useEffect, useState } from 'react';
import type { Evaluation, EvaluationStatus } from '../../domain/evaluationChallenge.types';
import { evaluationApi } from '../../infrastructure/evaluationApi';
import { emptyEvaluation } from '../utils/evaluationUtils';
import '../styles/EvaluationsAndChallengesPage.css';

interface EvaluationModalProps {
  evaluation?: Evaluation | null;
  courseId: string;
  token: string;
  onSave: () => void;
  onClose: () => void;
}

type EvaluationFormData = Omit<Evaluation, 'id' | 'challenges'>;

export function EvaluationModal({ evaluation, courseId, token, onSave, onClose }: EvaluationModalProps) {
  const isEditing = Boolean(evaluation);

  const [form, setForm] = useState<EvaluationFormData>(() =>
    evaluation
      ? {
          title: evaluation.title || '',
          description: evaluation.description || '',
          startDate: evaluation.startDate?.split('T')[0] || '',
          endDate: evaluation.endDate?.split('T')[0] || '',
          status: evaluation.status || 'ACTIVE',
          durationMinutes: evaluation.durationMinutes || 90,
          maxAttempts: evaluation.maxAttempts || 3,
          isVisible: evaluation.isVisible ?? false,
          courseName: evaluation.courseName || '',
        }
      : {
          title: emptyEvaluation.title,
          description: emptyEvaluation.description,
          startDate: emptyEvaluation.startDate,
          endDate: emptyEvaluation.endDate,
          status: emptyEvaluation.status,
          durationMinutes: emptyEvaluation.durationMinutes,
          maxAttempts: emptyEvaluation.maxAttempts,
          isVisible: emptyEvaluation.isVisible,
          courseName: emptyEvaluation.courseName,
        },
  );
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleChange = (field: keyof EvaluationFormData, value: string | number | boolean | EvaluationStatus) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError('');
  };

  const validate = (): string => {
    if (!form.title.trim()) return 'El nombre de la evaluación es obligatorio.';
    if (!form.description.trim()) return 'La descripción de la evaluación es obligatoria.';
    if (!form.startDate) return 'La fecha de inicio es obligatoria.';
    if (!form.endDate) return 'La fecha de cierre es obligatoria.';
    if (new Date(form.endDate) < new Date(form.startDate)) return 'La fecha de cierre no puede ser anterior a la de inicio.';
    if (!form.durationMinutes || form.durationMinutes < 1) return 'La duración debe ser mayor a 0 minutos.';
    if (!form.maxAttempts || form.maxAttempts < 1) return 'Los intentos máximos deben ser mínimo 1.';
    return '';
  };

  const handleSave = async () => {
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setIsSaving(true);
    try {
      const { courseName, status, isVisible, ...rest } = form;
      const payload = { ...rest, courseId };

      if (isEditing && evaluation) {
        await evaluationApi.update(evaluation.id.toString(), payload, token);
        await evaluationApi.changeVisibility(evaluation.id.toString(), isVisible, token);
      } else {
        const created: any = await evaluationApi.create(payload, token);
        const newId = created?.data?.id ?? created?.id;
        if (isVisible && newId) {
          await evaluationApi.changeVisibility(newId, true, token);
        }
      }
      onSave();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la evaluación.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="eval-modal-backdrop" role="dialog" aria-modal="true" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <section className="eval-modal eval-modal-md">
        <div className="eval-modal-header">
          <div>
            <span className="eval-page-eyebrow">{isEditing ? 'EDITAR EVALUACIÓN' : 'NUEVA EVALUACIÓN'}</span>
            <h2>{isEditing ? 'Editar evaluación' : 'Crear evaluación'}</h2>
          </div>
          <button type="button" className="eval-modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        <div className="eval-modal-body">
          {error && (
            <div className="eval-warning-banner" style={{ marginBottom: 16 }}>{error}</div>
          )}

          <div className="eval-form-grid">
          <div className="eval-form-group full">
            <label>Nombre de la evaluación</label>
            <input value={form.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Ej: Parcial SQL" />
          </div>

          <div className="eval-form-group full">
            <label>Descripción</label>
            <textarea value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Describe la evaluación..." />
          </div>

          <div className="eval-form-group">
            <label>Fecha de inicio</label>
            <input type="date" value={form.startDate} onChange={(e) => handleChange('startDate', e.target.value)} />
          </div>

          <div className="eval-form-group">
            <label>Fecha de cierre</label>
            <input type="date" value={form.endDate} onChange={(e) => handleChange('endDate', e.target.value)} />
          </div>

          <div className="eval-form-group">
            <label>Duración en minutos</label>
            <input type="number" min={1} value={form.durationMinutes} onChange={(e) => handleChange('durationMinutes', Number(e.target.value))} />
          </div>

          <div className="eval-form-group">
            <label>Intentos máximos</label>
            <input type="number" min={1} value={form.maxAttempts} onChange={(e) => handleChange('maxAttempts', Number(e.target.value))} />
          </div>

          <div className="eval-form-group full">
            <label>Visibilidad</label>
            <label className="eval-toggle-label">
              <input
                type="checkbox"
                className="eval-toggle-input"
                checked={form.isVisible}
                onChange={(e) => handleChange('isVisible', e.target.checked)}
              />
              <span className="eval-toggle-track">
                <span className="eval-toggle-thumb" />
              </span>
              <span className="eval-toggle-text">
                {form.isVisible ? 'Visible para estudiantes' : 'Oculta para estudiantes'}
              </span>
            </label>
          </div>
        </div>        </div>
        <div className="eval-modal-footer">
          <button type="button" className="eval-secondary-btn" onClick={onClose} disabled={isSaving}>
            Cancelar
          </button>
          <button type="button" className="eval-primary-btn" onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear evaluación'}
          </button>
        </div>
      </section>
    </div>
  );
}
