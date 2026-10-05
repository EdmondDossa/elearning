import { PartialType } from '@nestjs/mapped-types';
import { Level } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateCourseDto {
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  instructor: string;

  @Matches(/^[a-z]{2}$/, {
    message: 'language doit être un code à 2 lettres (fr, en…)',
  })
  language: string;

  @IsEnum(Level)
  level: Level;

  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;
}

// Tous les champs deviennent optionnels, avec les mêmes règles de validation
export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
