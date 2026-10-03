import { IsBoolean, IsInt, IsOptional, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsInt({ message: 'positionSec doit être un entier (secondes)' })
  @Min(0)
  positionSec?: number;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
