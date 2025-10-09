import { IsEmail, IsString, IsOptional, Length, IsIn, ValidateIf, ArrayMinSize, ArrayMaxSize, IsEnum, IsArray, validate, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ValidationError } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

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
  code!: string;
}

export class OnboardingDto {
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString()
  @IsOptional()
  name!: string;

  @ApiProperty({ example: 'male', enum: ['male', 'female', 'other', 'prefer_not_to_say'] })
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'])
  @IsOptional()
  gender!: string;

  @ApiProperty({ example: 'English', description: 'Preferred language' })
  @IsString()
  @IsOptional()
  preferredLanguage!: string;

  @ApiProperty({ example: 'USD', description: 'Preferred currency' })
  @IsString()
  @IsOptional()
  preferredCurrency!: string;

  @ApiProperty({ example: ['solo', 'friends'], description: 'Traveler types' })
  @IsArray({ message: 'Traveler types must be an array' })
  @ArrayMinSize(1, { message: 'At least one traveler type is required' })
  @ArrayMaxSize(5, { message: 'Maximum 5 traveler types allowed' })
  @IsEnum(['solo', 'couples', 'friends', 'family', 'business'], { each: true, message: 'Each traveler type must be: solo, couples, friends, family, or business' })
  @IsOptional()
  travelerTypes!: string[];

  @ApiProperty({ example: ['tuk-tuk', 'car-van-rental'], description: 'Transportation preferences' })
  @IsArray({ message: 'Transportation preferences must be an array' })
  @ArrayMinSize(1, { message: 'At least one transportation preference is required' })
  @ArrayMaxSize(6, { message: 'Maximum 6 transportation preferences allowed' })
  @IsEnum(['tuk-tuk', 'bike', 'public-buses', 'public-trains', 'car-van-rental', 'walking-cycling'], { each: true, message: 'Each transportation preference must be: tuk-tuk, bike, public-buses, public-trains, car-van-rental, or walking-cycling' })
  @IsOptional()
  transportationPreferences!: string[];

  @ApiProperty({ example: ['lankan-cuisines', 'western-cuisines'], description: 'Food/drink preferences' })
  @IsArray({ message: 'Food/drink preferences must be an array' })
  @ArrayMinSize(1, { message: 'At least one food/drink preference is required' })
  @ArrayMaxSize(16, { message: 'Maximum 16 food/drink preferences allowed' })
  @IsEnum([
    'lankan-cuisines', 'western-cuisines', 'chinese-other-asian-cuisines', 'indian-cuisines', 'middle-eastern-cuisine',
    'dining', 'street-food', 'vegetarian', 'gluten-free', 'desserts-sweets', 'coffee-tea', 'drinks-juice-bars', 'alcoholic-drinks'
  ], { each: true, message: 'Each food/drink preference must be one of the allowed values' })
  @IsOptional()
  foodDrinkPreferences!: string[];

  @ApiProperty({ example: ['misty-highlands', 'beaches'], description: 'Sri Lanka vibes' })
  @IsArray({ message: 'Sri Lanka vibes must be an array' })
  @ArrayMinSize(1, { message: 'At least one Sri Lanka vibe is required' })
  @ArrayMaxSize(8, { message: 'Maximum 8 Sri Lanka vibes allowed' })
  @IsEnum([
    'misty-highlands', 'waterfalls-parks', 'beaches', 'art-craft', 'food-culinary', 'photography', 'spa-meditation', 'shopping-markets'
  ], { each: true, message: 'Each Sri Lanka vibe must be one of the allowed values' })
  @IsOptional()
  sriLankaVibes!: string[];
}

export class OnboardingBasicDto {
  @ApiProperty({ example: 'John Doe', description: 'User full name' })
  @IsString({ message: 'Name must be a string' })
  name!: string;

  @ApiProperty({ example: 'male', enum: ['male', 'female', 'other', 'prefer_not_to_say'] })
  @IsIn(['male', 'female', 'other', 'prefer_not_to_say'], { message: 'Gender must be one of: male, female, other, prefer_not_to_say' })
  gender!: string;

  @ApiProperty({ example: 'English', description: 'Preferred language' })
  @IsString({ message: 'Preferred language must be a string' })
  preferredLanguage!: string;

  @ApiProperty({ example: 'USD', description: 'Preferred currency' })
  @IsString({ message: 'Preferred currency must be a string' })
  preferredCurrency!: string;
}

export class OnboardingSurveyDto {
  @ApiProperty({ example: ['solo', 'friends'], description: 'Traveler types' })
  @IsArray({ message: 'Traveler types must be an array' })
  @ArrayMinSize(1, { message: 'At least one traveler type is required' })
  @ArrayMaxSize(5, { message: 'Maximum 5 traveler types allowed' })
  @IsEnum(['solo', 'couples', 'friends', 'family', 'business'], { each: true, message: 'Each traveler type must be: solo, couples, friends, family, or business' })
  travelerTypes!: string[];

  @ApiProperty({ example: ['tuk-tuk', 'car-van-rental'], description: 'Transportation preferences' })
  @IsArray({ message: 'Transportation preferences must be an array' })
  @ArrayMinSize(1, { message: 'At least one transportation preference is required' })
  @ArrayMaxSize(6, { message: 'Maximum 6 transportation preferences allowed' })
  @IsEnum(['tuk-tuk', 'bike', 'public-buses', 'public-trains', 'car-van-rental', 'walking-cycling'], { each: true, message: 'Each transportation preference must be: tuk-tuk, bike, public-buses, public-trains, car-van-rental, or walking-cycling' })
  transportationPreferences!: string[];

  @ApiProperty({ example: ['lankan-cuisines', 'western-cuisines'], description: 'Food/drink preferences' })
  @IsArray({ message: 'Food/drink preferences must be an array' })
  @ArrayMinSize(1, { message: 'At least one food/drink preference is required' })
  @ArrayMaxSize(16, { message: 'Maximum 16 food/drink preferences allowed' })
  @IsEnum([
    'lankan-cuisines', 'western-cuisines', 'chinese-other-asian-cuisines', 'indian-cuisines', 'middle-eastern-cuisine',
    'dining', 'street-food', 'vegetarian', 'gluten-free', 'desserts-sweets', 'coffee-tea', 'drinks-juice-bars', 'alcoholic-drinks'
  ], { each: true, message: 'Each food/drink preference must be one of the allowed values' })
  foodDrinkPreferences!: string[];

  @ApiProperty({ example: ['misty-highlands', 'beaches'], description: 'Sri Lanka vibes' })
  @IsArray({ message: 'Sri Lanka vibes must be an array' })
  @ArrayMinSize(1, { message: 'At least one Sri Lanka vibe is required' })
  @ArrayMaxSize(8, { message: 'Maximum 8 Sri Lanka vibes allowed' })
  @IsEnum([
    'misty-highlands', 'waterfalls-parks', 'beaches', 'art-craft', 'food-culinary', 'photography', 'spa-meditation', 'shopping-markets'
  ], { each: true, message: 'Each Sri Lanka vibe must be one of the allowed values' })
  sriLankaVibes!: string[];
}

export class FullOnboardingDto {
  // Basic info
  @ApiProperty({ type: OnboardingBasicDto })
  basic!: OnboardingBasicDto;

  // Survey
  @ApiProperty({ type: OnboardingSurveyDto })
  survey!: OnboardingSurveyDto;

  // Add method to validate and log errors
  static async validate(dto: any): Promise<ValidationError[] | null> {
    const instance = plainToClass(FullOnboardingDto, dto);
    const errors = await validate(instance, { validationError: { target: false } });
    if (errors.length > 0) {
      console.log('Validation errors:', errors);
    }
    return errors.length > 0 ? errors : null;
  }
}

export class OAuthProfileDto {
  @ApiProperty({ example: 'john.doe@gmail.com', description: 'User email from provider' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'John Doe', description: 'User name from provider' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'google-12345', description: 'Provider-specific ID' })
  @IsString()
  providerId!: string;

  @ApiProperty({ example: 'google', description: 'Provider name (google/facebook)' })
  @IsIn(['google', 'facebook'])
  provider!: string;
}

export class AuthResponseDto {
  @ApiProperty({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', description: 'JWT access token' })
  accessToken!: string;

  @ApiProperty({ example: true, description: 'Is this a new user?' })
  isNewUser!: boolean;

  @ApiProperty({ example: false, description: 'Is onboarding completed?' })
  isOnboarded!: boolean;
}


// New DTOs
export class PlanDto {
  @ApiProperty({ example: 'free', description: 'Plan ID' })
  id!: string;

  @ApiProperty({ example: 'Free', description: 'Plan name' })
  name!: string;

  @ApiProperty({ example: 0, description: 'Feature level (0=Free, 1=Basic, 2=Premium)' })
  level!: number;

  @ApiProperty({ example: 0, description: 'Monthly price' })
  price!: number;

  @ApiProperty({ example: ['Basic trip viewing'], description: 'Allowed features' })
  features!: string[];

  @ApiProperty({ example: 'lifetime', description: 'Duration' })
  duration!: string;
}

export class SubscriptionDto {
  @ApiProperty({ example: 'sub_123', description: 'Subscription ID' })
  id!: string;

  @ApiProperty({ example: 'user_123', description: 'User ID' })
  userId!: string;

  @ApiProperty({ type: PlanDto, description: 'Associated plan' })
  plan!: PlanDto; // Populated in response

  @ApiProperty({ example: 'active', enum: ['active', 'inactive', 'expired'] })
  status!: string;

  @ApiProperty({ example: '2025-10-08T00:00:00Z', description: 'Start date' })
  startDate!: string;

  @ApiProperty({ example: null, description: 'End date (null for lifetime)' })
  endDate?: string | null;
}



export class LoginDto {
  @ApiProperty({ example: 'admin@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'User password' })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @Length(6, 128, { message: 'Password must be between 6 and 128 characters' })
  password: string;
}