export interface ICourseProfessorQuery {
  /** ID del profesor del curso, o `null` si el curso no existe. */
  getProfessorIdForCourse(courseId: string): Promise<string | null>;
}
