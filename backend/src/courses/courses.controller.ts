import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CoursesService } from './courses.service';
import { QueryCoursesDto } from './dto/query-courses.dto';

@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryCoursesDto) {
    return this.courses.findAll(query);
  }

  // Déclarée AVANT ':id', sinon "filters" serait interprété comme un identifiant
  @Public()
  @Get('filters')
  getFilters() {
    return this.courses.getFilters();
  }

  @Public()
  @Get(':id')
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    return this.courses.findOne(id, user?.sub);
  }

  @Post(':id/enroll')
  enroll(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.courses.enroll(id, user.sub);
  }
}
