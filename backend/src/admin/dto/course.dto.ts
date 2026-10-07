import { ApiProperty } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
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
  @ApiProperty({
    example: 'Introduction à JavaScript',
    minLength: 3,
    maxLength: 120,
  })
  title: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @ApiProperty({ example: 'Alex Martin', minLength: 2, maxLength: 80 })
  instructor: string;

  @Matches(/^[a-z]{2}$/, {
    message: 'language doit être un code à 2 lettres (fr, en…)',
  })
  @ApiProperty({ example: 'fr', pattern: '^[a-z]{2}$' })
  language: string;

  @IsEnum(Level)
  @ApiProperty({ enum: Level, example: 'BEGINNER' })
  level: Level;

  @Transform(trim)
  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  @ApiProperty({
    example: 'Découvrir les bases du langage JavaScript.',
    minLength: 10,
    maxLength: 2000,
  })
  description: string;
}

// Tous les champs deviennent optionnels, avec les mêmes règles de validation
export class UpdateCourseDto extends PartialType(CreateCourseDto) {}
