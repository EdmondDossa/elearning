import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

// Uniquement des fichiers servis par l'API : pas d'URL externe, pas de "javascript:", pas de "../"
const MEDIA_URL = /^\/media\/[\w-]+(\.[\w-]+)*$/;
const MEDIA_MESSAGE = 'URL de média invalide (attendu : /media/nom-du-fichier)';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class TrackDto {
  @Matches(/^[a-z]{2}$/)
  @ApiProperty({ example: 'fr', pattern: '^[a-z]{2}$' })
  language: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  @ApiProperty({ example: 'Français', minLength: 2, maxLength: 30 })
  label: string;

  @Matches(MEDIA_URL, { message: MEDIA_MESSAGE })
  @ApiProperty({ example: '/media/c1m1.fr.m4a', pattern: MEDIA_URL.source })
  url: string;
}

export class AudioTrackDto extends TrackDto {
  @IsBoolean()
  @ApiProperty({
    example: true,
    description: 'Exactement une piste audio doit être la VO.',
  })
  isDefault: boolean;
}

export class CreateModuleDto {
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  @ApiProperty({
    example: 'Les premières notions',
    minLength: 3,
    maxLength: 120,
  })
  title: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  @ApiPropertyOptional({ example: 'Présentation du module', maxLength: 500 })
  description?: string;

  @IsInt()
  @Min(1)
  @Max(36000)
  @ApiProperty({ example: 20, minimum: 1, maximum: 36000, type: 'integer' })
  durationSec: number;

  @Matches(MEDIA_URL, { message: MEDIA_MESSAGE })
  @ApiProperty({ example: '/media/c1m1.mp4', pattern: MEDIA_URL.source })
  videoUrl: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une piste audio est requise' })
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AudioTrackDto)
  @ApiProperty({ type: [AudioTrackDto], minItems: 1, maxItems: 10 })
  audioTracks: AudioTrackDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => TrackDto)
  @ApiPropertyOptional({ type: [TrackDto], maxItems: 10 })
  subtitles?: TrackDto[];
}

export class UpdateModuleDto extends PartialType(CreateModuleDto) {}
