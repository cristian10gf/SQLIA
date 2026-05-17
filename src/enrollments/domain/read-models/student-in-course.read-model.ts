export interface StudentInCourseReadModel {
  student: {
    id: string;
    fullName: string;
    email: string;
  };
  enrolledAt: Date;
}
