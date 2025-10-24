import { IsString, IsArray, IsNumber, IsPositive, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTripDto {
  @ApiProperty({ example: 'My Sri Lanka Adventure' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Sri Lanka' })
  @IsString()
  destination: string;

  @ApiProperty({ example: ['2025-12-01', '2025-12-07'] })
  @IsArray()
  @IsString({ each: true })
  dates: string[];

  @ApiProperty({ example: 1500, description: 'In USD' })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  budget?: number;
}

export class UpdateTripDto {
  @ApiProperty({ example: 'Updated Trip Name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 'Updated Destination' })
  @IsString()
  @IsOptional()
  destination?: string;

  @ApiProperty({ example: ['2025-12-01', '2025-12-08'] })
  @IsArray()
  @IsOptional()
  dates?: string[];

  @ApiProperty({ example: 2000 })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  budget?: number;
}

export class AddItineraryItemDto {
  @ApiProperty({ example: { type: 'place', name: 'Kithal Ella Waterfall', location: 'Ella', photoUrl: 'https://example.com/photo.jpg' } })
  activity: {
    type: 'place' | 'stay' | 'food' | 'activity';
    name: string;
    description?: string;
    rating?: number;
    location: string;
    time?: string; // ISO time string (e.g., '09:00:00')
    photoUrl?: string;
    placeId?: string;
    notes?: [],
    checklist?: []
  };
}

export class AddNoteDto {
  @ApiProperty({ example: 'Preparation Note' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Pack sunscreen and hat for this activity' })
  @IsString()
  content: string;
}

export class AddNoteResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Note added' })
  message: string;

  @ApiProperty()
  note: { title: string; content: string; createdAt: string };
}
export class AddChecklistItemDto {
  @ApiProperty({ example: 'Preparation Checklist' })
  @IsString()
  title: string;

  @ApiProperty({ 
    type: 'array', 
    items: { type: 'string' },
    description: 'Array of text items to add to the checklist. If title exists, appends; else creates new.',
    example: ['Book surf lesson', 'Pack sunscreen', 'Confirm reservation']
  })
  @IsArray()
  @IsString({ each: true })
  texts: string[];
}

export class AddChecklistItemResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Checklist items added' })
  message: string;

  @ApiProperty()
  checklist: { id: string; title: string; items: { id: string; text: string; completed: boolean }[] };
}

export class UpdateChecklistItemDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  completed: boolean;
}

export class UpdateChecklistItemResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 'Checklist item updated' })
  message: string;
}

export class CreateAITripDto {
  @ApiProperty({ example: 'My Sri Lanka Adventure' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Sri Lanka' })
  @IsString()
  destination: string;

  @ApiProperty({ example: [1500], description: 'In USD' })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  budget?: number;

  @ApiProperty({ example: ['Beaches', 'Waterfalls', 'Caves'] })
  @IsArray()
  @IsString({ each: true })
  interests: string[];

  @ApiProperty({ example: 'Vegetarian meals only', required: false })
  @IsString()
  @IsOptional()
  specialRequests?: string;

  @ApiProperty({ example: ['2025-12-01', '2025-12-07'], required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dates?: string[];
}

export class SearchLocationsDto {
  @ApiProperty({ example: 'beach waterfall' })
  @IsString()
  query: string;

  @ApiProperty({ example: 5, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 5;
}

export class LocationSuggestionDto {
  @ApiProperty({ example: 'Sigiriya Rock Fortress' })
  name: string;

  @ApiProperty({ example: 'Ancient rock fortress in Sri Lanka' })
  description: string;

  @ApiProperty({ example: 'Sigiriya, Sri Lanka' })
  address: string;

  @ApiProperty({ example: 'https://maps.googleapis.com/maps/api/place/photo?...' })
  photoUrl: string;

  @ApiProperty({ example: 4.7 })
  rating: number;

  @ApiProperty({ example: 'ChIJ...' })
  placeId: string;
}