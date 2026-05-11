export type Course = {
  id: string;
  name: string;
  code: string;
  period: string;
  group: string;
  professorId: string;
};

export type CoursePayload = {
  name: string;
  code: string;
  period: string;
  group: string;
  professorId: string;
};

export type CourseListResponse =
  | Course[]
  | {
      data: Course[];
      total?: number;
      page?: number;
      limit?: number;
    };

export type CourseMutationResponse = {
  message: string;
  data?: Course;
};