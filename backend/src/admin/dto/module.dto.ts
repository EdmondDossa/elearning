import { PartialType } from '@nestjs/mapped-types';
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
  language: string;

  @Transform(trim)
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  label: string;

  @Matches(MEDIA_URL, { message: MEDIA_MESSAGE })
  url: string;
}

export class AudioTrackDto extends TrackDto {
  @IsBoolean()
  isDefault: boolean;
}

export class CreateModuleDto {
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  title: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsInt()
  @Min(1)
  @Max(36000)
  durationSec: number;

  @Matches(MEDIA_URL, { message: MEDIA_MESSAGE })
  videoUrl: string;

  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une piste audio est requise' })
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => AudioTrackDto)
  audioTracks: AudioTrackDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => TrackDto)
  subtitles?: TrackDto[];
}

export class UpdateModuleDto extends PartialType(CreateModuleDto) {}
