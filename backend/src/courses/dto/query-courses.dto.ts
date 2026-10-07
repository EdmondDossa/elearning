import { ApiPropertyOptional } from '@nestjs/swagger';
import { Level } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class QueryCoursesDto {
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  @ApiPropertyOptional({ example: 'JavaScript', maxLength: 100 })
  search?: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @Length(2, 5)
  @ApiPropertyOptional({ example: 'fr', minLength: 2, maxLength: 5 })
  language?: string;

  @IsOptional()
  @IsEnum(Level, {
    message: `level doit être l'une des valeurs : ${Object.values(Level).join(', ')}`,
  })
  @ApiPropertyOptional({ enum: Level })
  level?: Level;
}
