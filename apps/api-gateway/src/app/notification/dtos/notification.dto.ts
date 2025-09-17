import { IsEmail, IsString, IsOptional, ArrayMinSize, ArrayMaxSize, IsArray, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDeviceTokenDto {
  @ApiProperty({ example: 'user123', description: 'User ID' })
  @IsString({ message: 'User ID must be a string' })
  userId!: string;

  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @ApiProperty({ example: 'ExponentPushToken[xxxx]', description: 'Expo push token' })
  @IsString({ message: 'Expo push token must be a string' })
  expoPushToken!: string;
}

export class SendNotificationDto {
  @ApiProperty({ example: 'user@example.com', description: 'Target user email (optional for global)' })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiProperty({ example: 'Welcome!', description: 'Notification title' })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  title!: string;

  @ApiProperty({ example: 'Check out our new features.', description: 'Notification content' })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content cannot be empty' })
  content!: string;

  @ApiProperty({ example: false, description: 'Is this a global notification?' })
  @IsOptional()
  isGlobal?: boolean;
}

export class SendToAllNotificationDto {
  @ApiProperty({ example: 'Global Update', description: 'Notification title' })
  @IsString({ message: 'Title must be a string' })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  title!: string;

  @ApiProperty({ example: 'New features available for all users.', description: 'Notification content' })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content cannot be empty' })
  content!: string;
}

export class GetNotificationsDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;
}

export class NotificationResponseDto {
  @ApiProperty({ example: 200, description: 'Status code' })
  status!: number;

  @ApiProperty({ example: 'Success message', description: 'Response message' })
  message!: string;

  @ApiProperty({ example: { id: 'notif123', title: 'Welcome' }, description: 'Notification data' })
  data?: any;
}