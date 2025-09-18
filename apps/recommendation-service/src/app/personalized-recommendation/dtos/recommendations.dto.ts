import { IsString, IsArray, IsEnum, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateRecommendationsDto {
  @ApiProperty({ example: 'user123', description: 'User ID' })
  @IsString({ message: 'User ID must be a string' })
  @IsNotEmpty({ message: 'User ID cannot be empty' })
  userId: string;

  @ApiProperty({ example: ['solo'], description: 'Traveler types', required: false })
  @IsOptional()
  @IsArray({ message: 'Traveler types must be an array' })
  @IsEnum(['solo', 'couples', 'friends', 'family', 'business'], { each: true })
  travelerTypes?: string[];

  @ApiProperty({ example: ['tuk-tuk'], description: 'Transportation preferences', required: false })
  @IsOptional()
  @IsArray({ message: 'Transportation preferences must be an array' })
  @IsEnum(['tuk-tuk', 'bike', 'public-buses', 'public-trains', 'car-van-rental', 'walking-cycling'], { each: true })
  transportationPreferences?: string[];

  @ApiProperty({ example: ['lankan-cuisines'], description: 'Food/drink preferences', required: false })
  @IsOptional()
  @IsArray({ message: 'Food/drink preferences must be an array' })
  @IsEnum([
    'lankan-cuisines', 'western-cuisines', 'chinese-other-asian-cuisines', 'indian-cuisines', 'middle-eastern-cuisine',
    'dining', 'street-food', 'vegetarian', 'gluten-free', 'desserts-sweets', 'coffee-tea', 'drinks-juice-bars', 'alcoholic-drinks'
  ], { each: true })
  foodDrinkPreferences?: string[];

  @ApiProperty({ example: ['misty-highlands'], description: 'Sri Lanka vibes', required: false })
  @IsOptional()
  @IsArray({ message: 'Sri Lanka vibes must be an array' })
  @IsEnum([
    'misty-highlands', 'waterfalls-parks', 'beaches', 'art-craft', 'food-culinary', 'photography', 'spa-meditation', 'shopping-markets'
  ], { each: true })
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