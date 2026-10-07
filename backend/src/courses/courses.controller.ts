import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Header,
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

@ApiTags('Formations')
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Public()
  @Get()
  @Header('Cache-Control', 'private, no-store')
  @Header('Vary', 'Cookie')
  @ApiOperation({
    summary: 'Rechercher et filtrer le catalogue',
    description:
      'Avec une session valide, learning contient le statut et la progression des formations suivies. Sinon, learning vaut null. Le statut distingue inscription sans lecture, activité et tous les modules terminés.',
  })
  findAll(
    @Query() query: QueryCoursesDto,
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    return this.courses.findAll(query, user?.sub);
  }

  // Déclarée AVANT ':id', sinon "filters" serait interprété comme un identifiant
  @Public()
  @Get('filters')
  @ApiOperation({ summary: 'Lister les langues et niveaux disponibles' })
  getFilters() {
    return this.courses.getFilters();
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Afficher une formation' })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload | undefined,
  ) {
    return this.courses.findOne(id, user?.sub);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'S’inscrire à une formation' })
  @ApiCookieAuth()
  @ApiUnauthorizedResponse({
    description: 'Session absente, expirée ou révoquée',
  })
  enroll(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.courses.enroll(id, user.sub);
  }
}
