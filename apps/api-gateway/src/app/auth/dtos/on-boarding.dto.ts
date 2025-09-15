
import { IsEmail, IsString, IsOptional, Length, IsIn, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


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