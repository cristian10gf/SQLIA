import { useState } from 'react';
import { aiApi } from '../../../ai/infrastructure/aiApi';

interface GenerateChallengeModalProps {
  setForm: React.Dispatch<React.SetStateAction<any>>;
  setShowGenerateChallenge: React.Dispatch<React.SetStateAction<boolean>>;
  token: string;
}

export function GenerateChallengeModal({
  setForm,
  setShowGenerateChallenge,
  token,
}: GenerateChallengeModalProps) {
  const [aiSuggestionPrompt, setAiSuggestionPrompt] = useState('');
  const [aiSuggestionFeedback, setAiSuggestionFeedback] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSendAiSuggestionPrompt = async () => {
    const prompt = aiSuggestionPrompt.trim();

    if (!prompt) {
      setAiSuggestionFeedback('Escribe el prompt que quieres enviar a la IA.');
      return;
    }

    try {
      setIsAiLoading(true);

      const response = await aiApi.generateChallenge(prompt, token!);

      console.log(response);

      setForm((prev: any) => ({
        ...prev,
        title: response.title || prev.title,
        description: response.description || prev.description,
        difficulty: response.difficulty || prev.difficulty,
        databaseEngine: response.databaseEngine || prev.databaseEngine,
        schemaDefinition: response.schemaDefinition || prev.schemaDefinition,
        seedScript: response.seedScript || prev.seedScript,
        expectedResult: response.expectedResult || prev.expectedResult,
        timeLimitMs: response.timeLimitMs || prev.timeLimitMs,
      }));

      setAiSuggestionFeedback('');
      setShowGenerateChallenge(false);
    } catch (error: any) {
      console.error('Error al generar el reto con IA:', error);
      setAiSuggestionFeedback(
        'No se pudo generar el reto. Por favor, verifica tu prompt o inténtalo más tarde.',
      );
    } finally {
      setIsAiLoading(false);
    }
  };
  return (
    <div
      className="eval-ai-modal-overlay"
      onClick={() => !isAiLoading && setShowGenerateChallenge(false)}
    >
      <div
        className="eval-ai-suggestion-box eval-ai-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {!isAiLoading && (
          <button
            type="button"
            className="eval-ai-modal-close-btn"
            onClick={() => setShowGenerateChallenge(false)}
          >
            &times;
          </button>
        )}

        {isAiLoading ? (
          <div className="eval-ai-loading-container">
            <div className="eval-ai-spinner"></div>
            <h4>Pensando...</h4>
            <p>
              La Inteligencia Artificial está estructurando y diseñando tu reto
              SQL personalizado.
            </p>
          </div>
        ) : (
          <>
            <div>
              <h4>Prompt para la IA</h4>
              <p>
                Escribe la instrucción que quieres enviar a la IA para generar
                el reto SQL. <strong>Esto puede tardar unos minutos.</strong>
              </p>
            </div>

            <textarea
              value={aiSuggestionPrompt}
              onChange={(event) => {
                setAiSuggestionPrompt(event.target.value);
                setAiSuggestionFeedback('');
              }}
              placeholder="Ej: Crea un reto SQL sobre joins entre clientes y órdenes, con dificultad media, usando PostgreSQL."
            />

            {aiSuggestionFeedback && (
              <span className="eval-ai-feedback">{aiSuggestionFeedback}</span>
            )}

            <div className="eval-ai-suggestion-footer">
              <button
                type="button"
                className="eval-secondary-btn"
                onClick={() => {
                  setAiSuggestionPrompt('');
                  setAiSuggestionFeedback('');
                }}
              >
                Limpiar
              </button>

              <button
                type="button"
                className="eval-primary-btn"
                onClick={handleSendAiSuggestionPrompt}
              >
                Enviar a IA
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
