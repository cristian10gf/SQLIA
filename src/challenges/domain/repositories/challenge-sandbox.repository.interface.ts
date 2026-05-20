export const CHALLENGE_SANDBOX_REPOSITORY = Symbol('CHALLENGE_SANDBOX_REPOSITORY');

export type ChallengeSandboxStatusValue =
  | 'PENDING'
  | 'PROVISIONING'
  | 'READY'
  | 'ERROR'
  | 'EXPIRED';

export interface ChallengeSandboxRecord {
  id: string;
  challengeId: string;
  status: ChallengeSandboxStatusValue;
  dockerContainerName: string | null;
  hostPort: number | null;
  dbUser: string | null;
  dbPassword: string | null;
  dbName: string | null;
  connectionHost: string | null;
  expiresAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChallengeSandboxRepository {
  findByChallengeId(challengeId: string): Promise<ChallengeSandboxRecord | null>;
  /** Crea fila PENDING solo si no existe (no modifica READY/PROVISIONING). */
  findOrCreatePending(challengeId: string): Promise<ChallengeSandboxRecord>;
  updateByChallengeId(
    challengeId: string,
    data: Partial<
      Pick<
        ChallengeSandboxRecord,
        | 'status'
        | 'dockerContainerName'
        | 'hostPort'
        | 'dbUser'
        | 'dbPassword'
        | 'dbName'
        | 'connectionHost'
        | 'expiresAt'
        | 'lastError'
      >
    >,
  ): Promise<ChallengeSandboxRecord>;

  /** PROVISIONING con `updatedAt` anterior a `before` (p. ej. worker o Docker colgados). */
  findChallengeIdsProvisioningOlderThan(before: Date): Promise<string[]>;

  /** READY cuyo sandbox ya venció pero el teardown diferido pudo fallar. */
  findChallengeIdsReadyExpired(asOf: Date): Promise<string[]>;
}
