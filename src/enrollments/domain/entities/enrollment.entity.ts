export class Enrollment {
  studentId: string;
  courseId: string;
  enrolledAt: Date;

  constructor(studentId: string, courseId: string, enrolledAt: Date) {
    this.studentId = studentId;
    this.courseId = courseId;
    this.enrolledAt = enrolledAt;
  }
}