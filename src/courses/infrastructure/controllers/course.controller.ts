import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CreateCourseUseCase } from '../../application/use-cases/create-course.use-case';
import { CreateCourseDto } from '../../application/dtos/create-course.dto';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
    constructor(private readonly createCourseUseCase: CreateCourseUseCase) { }
    @Post()
    @ApiOperation({ summary: 'Create a new course' })
    async createCourse(@Body() createCourseDto: CreateCourseDto) {
        const course = await this.createCourseUseCase.execute(createCourseDto);
        return {
            message: 'Curso creado exitosamente',
            data: course
        };
    }
}