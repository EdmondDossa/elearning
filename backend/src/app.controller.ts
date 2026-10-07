import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Controller, Get } from '@nestjs/common';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('Santé')
@Controller()
export class AppController {
  @Public()
  @Get('health')
  @ApiOperation({ summary: 'Vérifier que l’API répond' })
  health() {
    return { status: 'ok' };
  }
}
