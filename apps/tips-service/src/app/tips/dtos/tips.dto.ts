// dtos/tips.dto.ts
import { IsString, IsOptional, IsNumber, ValidateNested, IsBoolean, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CategoryDto {
  @ApiProperty({ example: 'Essentials' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Basic information for travelers' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Currency, water safety, etc.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  createdAt: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  updatedAt: string;
}

export class TipDto {
  @ApiProperty({ example: 'tip123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'category123' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'Currency' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Sri Lankan Rupees (LKR) are everywhere...' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  createdAt: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  updatedAt: string;
}

export class UserSummaryDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'john@example.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'user' })
  @IsString()
  role: string;
}

export class CreateCategoryDto {
  @ApiProperty({ example: 'admin123' })
  @IsString()
  adminId: string;

  @ApiProperty({ example: 'Essentials' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Basic information for travelers' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateCategoryResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Category created successfully' })
  @IsString()
  message: string;

  @ApiProperty({ type: CategoryDto })
  @ValidateNested()
  @Type(() => CategoryDto)
  category: CategoryDto;
}

export class GetCategoriesDto {
  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class GetCategoriesResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: [CategoryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  categories: CategoryDto[];

  @ApiProperty({ example: 4 })
  @IsNumber()
  total: number;
}

export class GetCategoryByIdDto {
  @ApiProperty({ example: 'category123' })
  @IsString()
  categoryId: string;
}

export class GetCategoryResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: CategoryDto })
  @ValidateNested()
  @Type(() => CategoryDto)
  category: CategoryDto;
}

export class UpdateCategoryDto {
  @ApiProperty({ example: 'category123' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  adminId: string;

  @ApiProperty({ example: 'Updated Essentials' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateCategoryResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Category updated successfully' })
  @IsString()
  message: string;

  @ApiProperty({ type: CategoryDto })
  @ValidateNested()
  @Type(() => CategoryDto)
  category: CategoryDto;
}

export class DeleteCategoryDto {
  @ApiProperty({ example: 'category123' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  adminId: string;
}

export class DeleteCategoryResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Category deleted successfully' })
  @IsString()
  message: string;
}

export class CreateTipDto {
  @ApiProperty({ example: 'admin123' })
  @IsString()
  adminId: string;

  @ApiProperty({ example: 'category123' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'Currency' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Sri Lankan Rupees (LKR) are everywhere...' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class CreateTipResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Tip created successfully' })
  @IsString()
  message: string;

  @ApiProperty({ type: TipDto })
  @ValidateNested()
  @Type(() => TipDto)
  tip: TipDto;
}

export class GetTipsDto {
  @ApiProperty({ example: 'category123', required: false })
  @IsString()
  @IsOptional()
  categoryId?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class GetTipsResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: [TipDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TipDto)
  tips: TipDto[];

  @ApiProperty({ example: 20 })
  @IsNumber()
  total: number;
}

export class GetTipByIdDto {
  @ApiProperty({ example: 'tip123' })
  @IsString()
  tipId: string;
}

export class GetTipResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: TipDto })
  @ValidateNested()
  @Type(() => TipDto)
  tip: TipDto;
}

export class UpdateTipDto {
  @ApiProperty({ example: 'tip123' })
  @IsString()
  tipId: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  adminId: string;

  @ApiProperty({ example: 'category123' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 'Updated Currency' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Updated content...' })
  @IsString()
  content: string;

  @ApiProperty({ example: 'https://example.com/new-image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdateTipResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Tip updated successfully' })
  @IsString()
  message: string;

  @ApiProperty({ type: TipDto })
  @ValidateNested()
  @Type(() => TipDto)
  tip: TipDto;
}

export class DeleteTipDto {
  @ApiProperty({ example: 'tip123' })
  @IsString()
  tipId: string;

  @ApiProperty({ example: 'admin123' })
  @IsString()
  adminId: string;
}

export class DeleteTipResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Tip deleted successfully' })
  @IsString()
  message: string;
}

export class GetAllUsersDto {
  @ApiProperty({ example: 'admin123' })
  @IsString()
  adminId: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class GetAllUsersResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: [UserSummaryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserSummaryDto)
  users: UserSummaryDto[];

  @ApiProperty({ example: 100 })
  @IsNumber()
  total: number;
}