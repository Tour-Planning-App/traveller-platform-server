import { IsString, IsArray, IsNumber, IsPositive, IsOptional,} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTripDto {
  @ApiProperty({ example: 'My Sri Lanka Adventure' })
  @IsString()
  name: string;

  @ApiProperty({ example: ['2025-12-01', '2025-12-07'] })
  @IsArray()
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
  @ApiProperty({ example: { type: 'place', name: 'Kithal Ella Waterfall', location: 'Ella' } })
  activity: {
    type: 'place' | 'stay' | 'food' | 'activity';
    name: string;
    description?: string;
    rating?: number;
    location: string;
    time?: string; // ISO time
  };
}