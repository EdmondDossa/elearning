import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsInt({ message: 'positionSec doit être un entier (secondes)' })
  @Min(0)
  @ApiPropertyOptional({ example: 12, minimum: 0, type: 'integer' })
  positionSec?: number;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional({ example: true })
  completed?: boolean;
}
