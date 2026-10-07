import {
  ApiTags,
  ApiOperation,
  ApiCookieAuth,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { JwtPayload } from '../auth/auth.types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Tableau de bord')
@ApiCookieAuth()
@ApiUnauthorizedResponse({
  description: 'Session absente, expirée ou révoquée',
})
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiOperation({
    summary: 'Afficher les formations suivies et leur progression',
  })
  get(@CurrentUser() user: JwtPayload) {
    return this.dashboard.getDashboard(user.sub);
  }
}
