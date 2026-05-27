import { useState } from 'react';
import type { Challenge, SandboxStatusValue } from '../../domain/evaluationChallenge.types';
import { challengeApi } from '../../infrastructure/challengeApi';
import '../styles/EvaluationsAndChallengesPage.css';

interface SandboxActionButtonProps {
  challenge: Challenge;
  token: string;
  sandboxStatus: SandboxStatusValue | null | undefined;
  onStatusChange: (challengeId: number | string, status: SandboxStatusValue | null) => void;
  small?: boolean;
}

export function SandboxActionButton({
  challenge,
  token,
  sandboxStatus,
  onStatusChange,
  small = false,
}: SandboxActionButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const sizeClass = small ? 'eval-small-btn' : '';
  const isPublished = challenge.visibility === 'PUBLIC';

  const handlePublish = async () => {
    setIsLoading(true);
    setError('');
    onStatusChange(challenge.id, 'PENDING');
    try {
      await challengeApi.publish(challenge.id.toString(), token);
    } catch (err) {
      onStatusChange(challenge.id, null);
      setError(err instanceof Error ? err.message : 'No se pudo publicar el reto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProvision = async () => {
    setIsLoading(true);
    setError('');
    onStatusChange(challenge.id, 'PENDING');
    try {
      await challengeApi.provision(challenge.id.toString(), token);
    } catch (err) {
      onStatusChange(challenge.id, null);
      setError(err instanceof Error ? err.message : 'No se pudo aprovisionar el entorno.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderButton = () => {
    if (isLoading) {
      return (
        <button type="button" className={`eval-provision-btn ${sizeClass}`} disabled>
          {isPublished ? 'Aprovisionando...' : 'Publicando...'}
        </button>
      );
    }

    if (sandboxStatus === 'PENDING' || sandboxStatus === 'PROVISIONING') {
      return (
        <button type="button" className={`eval-provision-btn ${sizeClass}`} disabled title="Aprovisionamiento en cola">
          En cola…
        </button>
      );
    }

    if (sandboxStatus === 'READY' && isPublished) {
      return (
        <span className={`eval-sandbox-ready-badge ${sizeClass}`}>✓ Entorno listo</span>
      );
    }

    if (!isPublished) {
      return (
        <button type="button" className={`eval-publish-btn ${sizeClass}`} onClick={handlePublish}>
          Publicar
        </button>
      );
    }

    return (
      <button type="button" className={`eval-provision-btn ${sizeClass}`} onClick={handleProvision}>
        Aprovisionar
      </button>
    );
  };

  return (
    <span className="eval-sandbox-action-wrapper">
      {renderButton()}
      {error && <span className="eval-sandbox-inline-error">{error}</span>}
    </span>
  );
}
