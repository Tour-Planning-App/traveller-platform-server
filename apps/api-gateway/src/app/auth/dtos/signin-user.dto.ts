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