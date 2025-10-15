import { IsString, IsArray, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateRecommendationsDto {
  @ApiProperty({ example: 'user123', description: 'User ID' })
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  userId: string;

  @ApiProperty({ example: 'solo', description: 'Traveler types', enum:['solo', 'couples', 'friends', 'family', 'business'] })
  @IsString()
  @IsOptional()
  travelerTypes!: string;

  @ApiProperty({ example: ['tuk-tuk'], description: 'Transportation preferences', required: false })
  @IsOptional()
  @IsArray({ message: 'Transportation preferences must be an array' })
  transportationPreferences?: string[];

  @ApiProperty({ example: ['surfing', 'wildlife-safari'], description: 'Activity preferences' })
  @IsArray({ message: 'Activity preferences must be an array' })
  @IsOptional()
  activityPreferences!: string[];

  @ApiProperty({ example: ['lankan-cuisines'], description: 'Food/drink preferences', required: false })
  @IsOptional()
  @IsArray({ message: 'Food/drink preferences must be an array' })
  foodDrinkPreferences?: string[];

  @ApiProperty({ example: ['misty-highlands'], description: 'Sri Lanka vibes', required: false })
  @IsOptional()
  @IsArray({ message: 'Sri Lanka vibes must be an array' })
  sriLankaVibes?: string[];
}

export class RecommendationResponseDto {
  @ApiProperty({ example: true, description: 'Success flag' })
  success: boolean;

  @ApiProperty({ example: 'Recommendations generated successfully', description: 'Message' })
  message: string;

  @ApiProperty({ type: [Object], description: 'Generated recommendations' })
  data?: any[];
}