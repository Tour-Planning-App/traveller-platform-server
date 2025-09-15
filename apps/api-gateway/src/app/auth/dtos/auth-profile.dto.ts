import { IsEmail, IsString, IsOptional, Length, IsIn, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


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