import {
    Controller,
    Post,
    Body,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCourseUseCase } from '../../application/use-cases/create-course.use-case';
import { CreateCourseDto } from '../../application/dtos/create-course.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../auth/domain/enums/role.enum';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
    constructor(private readonly createCourseUseCase: CreateCourseUseCase) { }

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo curso' })
    @ApiResponse({ type: CreateCourseDto })
    @ApiBearerAuth()    
    @Roles(Role.PROFESSOR)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async createCourse(@Body() createCourseDto: CreateCourseDto) {
        const course = await this.createCourseUseCase.execute(createCourseDto);
        return {
            message: 'Curso creado exitosamente',
            data: course
        };
    }
}