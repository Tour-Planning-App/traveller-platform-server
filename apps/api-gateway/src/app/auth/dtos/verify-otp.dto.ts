import { IsEmail, IsString, IsOptional, Length, IsIn, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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