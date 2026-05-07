import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../domain/enums/role.enum';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { GetUserByIdForAdminUseCase } from '../../application/use-cases/get-user-by-id-for-admin.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { UpdateUserDto } from '../../application/dtos/update-user.dto';
import { AdminPaginationDto } from '../../application/dtos/admin-pagination.dto';
import { UserResponseDto } from '../../application/dtos/user-response.dto';
import { AdminUserDetailDto } from '../../application/dtos/admin-user-detail.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { User } from '../../domain/entities/user.entity';
import { UserNotFoundError } from '../../domain/errors/user-not-found.error';
import { CannotDeleteSelfError } from '../../domain/errors/cannot-delete-self.error';
import { LastAdminAccountError } from '../../domain/errors/last-admin-account.error';
import { EmailAlreadyInUseError } from '../../domain/errors/email-already-in-use.error';
import { UserDeleteBlockedError } from '../../domain/errors/user-delete-blocked.error';

@ApiTags('users')
@Controller('users')
export class AdminUsersController {
  constructor(
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly getUserByIdForAdminUseCase: GetUserByIdForAdminUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar usuarios (solo administrador)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Listado paginado' })
  async list(@Query() pagination: AdminPaginationDto) {
    return await this.listUsersUseCase.execute(pagination);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener detalle de un usuario por ID (solo administrador)' })
  @ApiResponse({ type: AdminUserDetailDto })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    try {
      const data = await this.getUserByIdForAdminUseCase.execute(id);
      return { data };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Actualizar un usuario (solo administrador)' })
  @ApiResponse({ type: UserResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    if (
      dto.email === undefined &&
      dto.fullName === undefined &&
      dto.role === undefined &&
      dto.password === undefined
    ) {
      throw new BadRequestException(
        'Debe enviar al menos un campo para actualizar',
      );
    }
    try {
      const user = await this.updateUserUseCase.execute(id, dto);
      return {
        message: 'Usuario actualizado exitosamente',
        data: user,
      };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof EmailAlreadyInUseError) {
        throw new ConflictException(error.message);
      }
      if (error instanceof LastAdminAccountError) {
        throw new ForbiddenException(error.message);
      }
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar un usuario (solo administrador)' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() admin: User,
  ) {
    try {
      await this.deleteUserUseCase.execute(id, String(admin.id));
      return { message: 'Usuario eliminado exitosamente' };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof CannotDeleteSelfError) {
        throw new ForbiddenException(error.message);
      }
      if (error instanceof LastAdminAccountError) {
        throw new ForbiddenException(error.message);
      }
      if (error instanceof UserDeleteBlockedError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }
  }
}
