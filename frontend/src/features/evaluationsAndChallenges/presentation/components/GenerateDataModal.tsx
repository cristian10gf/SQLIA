import { useState } from 'react';
import { aiApi } from '../../../ai/infrastructure/aiApi';
import type { Challenge } from '../../domain/evaluationChallenge.types';

interface GenerateChallengeModalProps {
  schema: string;
  setForm: React.Dispatch<React.SetStateAction<any>>;
  setShowGenerateData: React.Dispatch<React.SetStateAction<boolean>>;
  token: string;
}

export function GenerateDataModal({
  schema,
  setForm,
  setShowGenerateData,
  token,
}: GenerateChallengeModalProps) {
  const [seedAiPrompt, setSeedAiPrompt] = useState('');
  const [seedAiFeedback, setSeedAiFeedback] = useState('');
  const [isSeedAiLoading, setIsSeedAiLoading] = useState(false);

  const handleSendSeedAiPrompt = async () => {
    const prompt = seedAiPrompt.trim();

    if (!prompt) {
      setSeedAiFeedback(
        'Escribe instrucciones (ej: Genera 50 clientes de Colombia).',
      );
      return;
    }

    try {
      setIsSeedAiLoading(true);
      const generatedScript = await aiApi.generateRandomData(
        schema,
        prompt,
        token!,
      );

      setForm((prev: any) => ({
        ...prev,
        seedScript: generatedScript,
      }));

      setShowGenerateData(false);
      setSeedAiPrompt('');
      setSeedAiFeedback('');
    } catch (error: any) {
      console.error('Error al generar los datos con IA:', error);
      setSeedAiFeedback(
        'No se pudieron generar los datos. Inténtalo más tarde.',
      );
    } finally {
      setIsSeedAiLoading(false);
    }
  };

  return (
    <div
      className="eval-ai-modal-overlay"
      onClick={() => !isSeedAiLoading && setShowGenerateData(false)}
    >
      <div
        className="eval-ai-suggestion-box eval-ai-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {!isSeedAiLoading && (
          <button
            type="button"
            className="eval-ai-modal-close-btn"
            onClick={() => setShowGenerateData(false)}
          >
            &times;
          </button>
        )}

        {isSeedAiLoading ? (
          <div className="eval-ai-loading-container">
            <div className="eval-ai-spinner"></div>
            <h4>Analizando Esquema...</h4>
            <p>
              La IA está leyendo tus tablas y generando los registros
              solicitados.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h4>Generador de Datos SQL</h4>
              <p>
                El esquema que se ingresó será enviado a la IA. Indica qué tipo
                de datos, cantidad o casos borde necesitas.{' '}
                <strong>Esto puede tardar unos minutos.</strong>
              </p>
            </div>

            <textarea
              value={seedAiPrompt}
              onChange={(event) => {
                setSeedAiPrompt(event.target.value);
                setSeedAiFeedback('');
              }}
              placeholder="Ej: Genera 20 registros con fechas entre 2023 y 2024, asegúrate de incluir valores nulos en el campo ciudad."
            />

            {seedAiFeedback && (
              <span className="eval-ai-feedback">{seedAiFeedback}</span>
            )}

            <div className="eval-ai-suggestion-footer">
              <button
                type="button"
                className="eval-secondary-btn"
                onClick={() => {
                  setSeedAiPrompt('');
                  setSeedAiFeedback('');
                }}
              >
                Limpiar
              </button>

              <button
                type="button"
                className="eval-primary-btn"
                onClick={handleSendSeedAiPrompt}
              >
                Generar Datos
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
