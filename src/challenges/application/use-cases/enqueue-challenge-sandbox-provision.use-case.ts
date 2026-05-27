import { Inject, Injectable, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CHALLENGE_REPOSITORY } from '../../domain/repositories/challenge.repository.interface';
import type { IChallengeRepository } from '../../domain/repositories/challenge.repository.interface';
import { CHALLENGE_SANDBOX_REPOSITORY } from '../../domain/repositories/challenge-sandbox.repository.interface';
import type { IChallengeSandboxRepository } from '../../domain/repositories/challenge-sandbox.repository.interface';
import type { ChallengeSandboxJob } from '../../infrastructure/queue/challenge-sandbox-provisioner.service';
import {
  CHALLENGE_COURSE_OWNERSHIP_QUERY,
  CHALLENGE_PUBLISH_FOR_SANDBOX_COMMAND,
} from '../../domain/interfaces/challenge-provisioning.tokens';
import type { IChallengeCourseOwnershipQuery } from '../../domain/interfaces/challenge-course-ownership.query.interface';
import type { IChallengePublishForSandboxCommand } from '../../domain/interfaces/challenge-publish-for-sandbox.command.interface';
import { CHALLENGE_SANDBOX_PROVISION_ENQUEUE_OPTS } from '../../../shared/infrastructure/queue/bull-job-options.presets';

@Injectable()
export class EnqueueChallengeSandboxProvisionUseCase {
  constructor(
    @Inject(CHALLENGE_REPOSITORY)
    private readonly challenges: IChallengeRepository,
    @Inject(CHALLENGE_SANDBOX_REPOSITORY)
    private readonly sandboxes: IChallengeSandboxRepository,
    @Inject(CHALLENGE_COURSE_OWNERSHIP_QUERY)
    private readonly courseOwnership: IChallengeCourseOwnershipQuery,
    @Inject(CHALLENGE_PUBLISH_FOR_SANDBOX_COMMAND)
    private readonly publishChallenge: IChallengePublishForSandboxCommand,
    @InjectQueue('challenge-sandbox') private readonly sandboxQueue: Queue,
  ) {}

  async execute(
    challengeId: string,
    requesterUserId: string,
    requesterRole: string,
  ): Promise<{ jobId: string | undefined }> {
    if (requesterRole !== 'PROFESSOR' && requesterRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Solo profesores pueden aprovisionar el sandbox',
      );
    }
    const challenge = await this.challenges.findById(challengeId);
    if (!challenge) {
      throw new ForbiddenException('Reto no encontrado');
    }
    if (requesterRole !== 'ADMIN') {
      const professorId =
        await this.courseOwnership.getCourseProfessorIdForChallenge(
          challengeId,
        );
      if (!professorId || professorId !== requesterUserId) {
        throw new ForbiddenException('No tenés permiso sobre este reto');
      }
    }

    await this.sandboxes.findOrCreatePending(challengeId);

    await this.publishChallenge.publishChallengeForSandboxProvision(
      challengeId,
    );

    const job = await this.sandboxQueue.add(
      'provision',
      { action: 'provision', challengeId } satisfies ChallengeSandboxJob,
      CHALLENGE_SANDBOX_PROVISION_ENQUEUE_OPTS,
    );

    return { jobId: job.id };
  }
}
