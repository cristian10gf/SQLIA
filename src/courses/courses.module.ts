import { Module } from '@nestjs/common';
import { CourseController } from './infrastructure/controllers/course.controller';
import { CreateCourseUseCase } from './application/use-cases/create-course.use-case';
import { UpdateCourseUseCase } from './application/use-cases/update-course.use-case';
import { FindAllCoursesUseCase } from './application/use-cases/find-all-courses.use-case';
import { FindCourseByIdUseCase } from './application/use-cases/find-course-by-id.use-case';
import { DeleteCourseUseCase } from './application/use-cases/delete-course.use-case';
import { PrismaCourseRepository } from './infrastructure/persistence/prisma-course.repository';
import { COURSE_REPOSITORY } from './domain/repositories/course.repository.interface';
import { PrismaModule } from '../prisma/prisma.module'; 

@Module({
  imports: [PrismaModule],
  controllers: [CourseController],
  providers: [
    CreateCourseUseCase,
    UpdateCourseUseCase,
    FindAllCoursesUseCase,
    FindCourseByIdUseCase,
    DeleteCourseUseCase,
    {
      provide: COURSE_REPOSITORY,
      useClass: PrismaCourseRepository,
    },
  ],
})
export class CoursesModule {}