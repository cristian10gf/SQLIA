import { Challenge } from '../entities/challenge.entity';
import { ChallengeVisibility } from '@prisma/client';

export const CHALLENGE_REPOSITORY = 'CHALLENGE_REPOSITORY';

export interface IChallengeRepository {
  save(challenge: Challenge): Promise<Challenge>;
  findById(id: string): Promise<Challenge | null>;
  findAll(skip: number, take: number): Promise<{ data: Challenge[]; total: number }>;
  findByCourse(
    courseId: string,
    skip: number,
    take: number,
    visibility?: boolean,
    maskExpectedResult?: boolean,
  ): Promise<{ data: Challenge[]; total: number }>;
  findByProfessor(
    professorId: string,
    skip: number,
    take: number,
    visibility?: boolean,
    maskExpectedResult?: boolean,
  ): Promise<{ data: Challenge[]; total: number }>;
  update(id: string, challenge: Partial<Challenge>): Promise<Challenge>;
  updateVisibility(id: string, visibility: ChallengeVisibility): Promise<Challenge>;
  delete(id: string): Promise<void>;
}
