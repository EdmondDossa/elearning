import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  @ApiProperty({ example: 'demo@elearning.local', format: 'email' })
  email: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Demo1234!', minLength: 1, writeOnly: true })
  password: string;
}
