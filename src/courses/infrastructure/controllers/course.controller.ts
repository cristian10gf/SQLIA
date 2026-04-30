import {
    Controller,
    Post,
    Body,
    UseGuards,
    Get,
    Patch,
    Delete,
    Param,
    ParseUUIDPipe
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCourseUseCase } from '../../application/use-cases/create-course.use-case';
import { UpdateCourseUseCase } from '../../application/use-cases/update-course.use-case';
import { FindAllCoursesUseCase } from '../../application/use-cases/find-all-courses.use-case';
import { FindCourseByIdUseCase } from '../../application/use-cases/find-course-by-id.use-case';
import { DeleteCourseUseCase } from '../../application/use-cases/delete-course.use-case';
import { CreateCourseDto } from '../../application/dtos/create-course.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../auth/domain/enums/role.enum';

@ApiTags('Courses')
@Controller('courses')
export class CourseController {
    constructor(
        private readonly createUseCase: CreateCourseUseCase,
        private readonly updateUseCase: UpdateCourseUseCase,
        private readonly findAllUseCase: FindAllCoursesUseCase,
        private readonly findByIdUseCase: FindCourseByIdUseCase,
        private readonly deleteUseCase: DeleteCourseUseCase,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Crear un nuevo curso' })
    @ApiResponse({ type: CreateCourseDto })
    @ApiBearerAuth()
    @Roles(Role.PROFESSOR)
    @UseGuards(JwtAuthGuard, RolesGuard)
    async createCourse(@Body() createCourseDto: CreateCourseDto) {
        const course = await this.createUseCase.execute(createCourseDto);
        return {
            message: 'Curso creado exitosamente',
            data: course
        };
    }

    @Get()
    @ApiOperation({ summary: 'Obtener todos los cursos' })
    @ApiResponse({ type: [CreateCourseDto] })
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.PROFESSOR, Role.ADMIN)
    async findAll() {
        return await this.findAllUseCase.execute();
    }


    @Get(':id')
    @ApiOperation({ summary: 'Obtener un curso por ID' })
    @ApiResponse({ type: CreateCourseDto })
    @ApiBearerAuth()
    @Roles( Role.PROFESSOR, Role.ADMIN)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return await this.findByIdUseCase.execute(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Actualizar un curso' })
    @ApiResponse({ type: UpdateCourseUseCase })
    @ApiBearerAuth()
    @Roles(Role.PROFESSOR, Role.ADMIN)
    async update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCourseUseCase) {
        await this.updateUseCase.execute(id, dto);
        return { message: 'Curso actualizado exitosamente' };
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Eliminar un curso' })
    @ApiResponse({ type: CreateCourseDto })
    @ApiBearerAuth()
    @Roles(Role.PROFESSOR, Role.ADMIN)
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.deleteUseCase.execute(id);
        return { message: 'Curso eliminado exitosamente' };
    }
}