import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CreateCourseDto, UpdateCourseDto } from './dto/course.dto';
import { CreateModuleDto, UpdateModuleDto } from './dto/module.dto';

@Roles(Role.ADMIN) // s'applique à toutes les routes du controller
@ApiTags('Administration')
@ApiCookieAuth()
@ApiUnauthorizedResponse({
  description: 'Session absente, expirée ou révoquée',
})
@ApiForbiddenResponse({ description: 'Rôle ADMIN requis' })
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('courses')
  @ApiOperation({ summary: 'Lister les formations' })
  listCourses() {
    return this.admin.listCourses();
  }

  @Get('courses/:id')
  @ApiOperation({ summary: 'Afficher une formation et ses modules' })
  getCourse(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.getCourse(id);
  }

  @Post('courses')
  @ApiOperation({ summary: 'Créer une formation' })
  createCourse(@Body() dto: CreateCourseDto) {
    return this.admin.createCourse(dto);
  }

  @Patch('courses/:id')
  @ApiOperation({ summary: 'Modifier une formation' })
  updateCourse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.admin.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer une formation et ses données associées' })
  deleteCourse(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteCourse(id);
  }

  @Post('courses/:id/modules')
  @ApiOperation({ summary: 'Ajouter un module' })
  createModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateModuleDto,
  ) {
    return this.admin.createModule(id, dto);
  }

  @Patch('modules/:id')
  @ApiOperation({ summary: 'Modifier un module' })
  updateModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.admin.updateModule(id, dto);
  }

  @Delete('modules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un module' })
  deleteModule(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteModule(id);
  }

  @Get('media')
  @ApiOperation({ summary: 'Lister les médias préchargés' })
  listMedia() {
    return this.admin.listMedia();
  }
}
