import { IsEmail, IsString, IsOptional, Length, IsIn, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignInDto {
  @ApiProperty({ example: 'john@example.com', description: 'User email or phone number' })
  @IsString()
  @ValidateIf(o => o.email)
  @IsEmail({}, { message: 'Invalid email' })
  email?: string;

  @ApiProperty({ example: '+1234567890', description: 'User phone number' })
  @IsString()
  @ValidateIf(o => o.phone)
  phone?: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: 'john@example.com', description: 'User email' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email' })
  email?: string;

  @ApiProperty({ example: '+1234567890', description: 'User phone number' })
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  code: string;
}

export class OnboardingDto {
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'male', enum: ['male', 'female', 'other', 'prefer_not_to_say'] })
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'])
  gender: string;

  @ApiProperty({ example: 'English', description: 'Preferred language' })
  @IsString()
  preferredLanguage: string;

  @ApiProperty({ example: 'USD', description: 'Preferred currency' })
  @IsString()
  preferredCurrency: string;
}

export class OAuthProfileDto {
  @ApiProperty({ example: 'john.doe@gmail.com', description: 'User email from provider' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', description: 'User name from provider' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'google-12345', description: 'Provider-specific ID' })
  @IsString()
  providerId: string;

  @ApiProperty({ example: 'google', description: 'Provider name (google/facebook)' })
  @IsIn(['google', 'facebook'])
  provider: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  accessToken: string;

  @ApiProperty({ example: true, description: 'Is this a new user?' })
  isNewUser: boolean;

  @ApiProperty({ example: false, description: 'Is onboarding completed?' })
  isOnboarded: boolean;
}