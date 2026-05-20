export interface StudentEvaluationScoreReadModel {
  submissionId: string;
  evaluation: {
    id: string;
    title: string;
  };
  score: number | null;
  status: string;
  submittedAt: Date;
}

export interface CourseOwnershipReadModel {
  id: string;
  professorId: string;
}