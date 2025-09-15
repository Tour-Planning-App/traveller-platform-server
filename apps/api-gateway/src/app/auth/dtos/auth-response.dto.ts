import { IsEmail, IsString, IsOptional, Length, IsIn, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ example: true, description: 'Is this a new user?' })
  isNewUser: boolean;

  @ApiProperty({ example: false, description: 'Is onboarding completed?' })
  isOnboarded: boolean;
}