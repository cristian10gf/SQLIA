import { Module } from '@nestjs/common';
import { CourseController } from './infrastructure/controllers/course.controller';
import { CreateCourseUseCase } from './application/use-cases/create-course.use-case';
import { PrismaCourseRepository } from './infrastructure/persistence/prisma-course.repository';
import { COURSE_REPOSITORY } from './domain/repositories/course.repository.interface';
import { PrismaModule } from '../prisma/prisma.module'; // Ajusta la ruta

@Module({
  imports: [PrismaModule],
  controllers: [CourseController],
  providers: [
    CreateCourseUseCase,
    {
      provide: COURSE_REPOSITORY,
      useClass: PrismaCourseRepository,
    },
  ],
})
export class CoursesModule {}