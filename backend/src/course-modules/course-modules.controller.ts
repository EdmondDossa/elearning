import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CourseModulesService } from './course-modules.service';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Controller('modules')
export class CourseModulesController {
  constructor(private readonly modules: CourseModulesService) {}

  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.modules.findOne(id, user.sub);
  }

  @Put(':id/progress')
  updateProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProgressDto,
  ) {
    return this.modules.updateProgress(id, user.sub, dto);
  }
}
