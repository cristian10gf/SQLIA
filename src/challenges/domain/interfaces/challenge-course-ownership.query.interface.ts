export interface IChallengeCourseOwnershipQuery {
  /** Profesor del curso del reto, o `null` si el reto no existe. */
  getCourseProfessorIdForChallenge(challengeId: string): Promise<string | null>;
}
