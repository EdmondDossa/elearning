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
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('courses')
  listCourses() {
    return this.admin.listCourses();
  }

  @Get('courses/:id')
  getCourse(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.getCourse(id);
  }

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.admin.createCourse(dto);
  }

  @Patch('courses/:id')
  updateCourse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.admin.updateCourse(id, dto);
  }

  @Delete('courses/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteCourse(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteCourse(id);
  }

  @Post('courses/:id/modules')
  createModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateModuleDto,
  ) {
    return this.admin.createModule(id, dto);
  }

  @Patch('modules/:id')
  updateModule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateModuleDto,
  ) {
    return this.admin.updateModule(id, dto);
  }

  @Delete('modules/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteModule(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteModule(id);
  }

  @Get('media')
  listMedia() {
    return this.admin.listMedia();
  }
}
