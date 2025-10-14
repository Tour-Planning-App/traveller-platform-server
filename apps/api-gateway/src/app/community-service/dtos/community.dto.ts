// dtos/post.dto.ts
import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LikeDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  created_at: string;
}

export class CommentDto {
  @ApiProperty({ example: 'comment123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: 'Great post!' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  created_at: string;
}

export class PostDto {
  @ApiProperty({ example: 'post123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: 'Amazing trip to Sri Lanka!' })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiProperty({ example: ['#srilanka', '#travel'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: 150 })
  @IsNumber()
  like_count: number;

  @ApiProperty({ type: [LikeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LikeDto)
  @IsOptional()
  likes?: LikeDto[];

  @ApiProperty({ type: [CommentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommentDto)
  @IsOptional()
  comments?: CommentDto[];

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  created_at: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  updated_at: string;
}

export class CreatePostDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: 'Amazing trip to Sri Lanka!' })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  image_url?: string;

  @ApiProperty({ example: ['#srilanka', '#travel'] })
  @IsArray()
  @IsOptional()
  tags?: string[];
}

export class CreatePostResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Post created successfully' })
  @IsString()
  message: string;

  @ApiProperty({ type: PostDto })
  @ValidateNested()
  @Type(() => PostDto)
  post: PostDto;
}

export class GetPostsDto {
  @ApiProperty({ example: 'user123', required: false })
  @IsString()
  @IsOptional()
  user_id?: string;

  @ApiProperty({ example: 'popular', enum: ['popular', 'following'] })
  @IsString()
  @IsOptional()
  feed_type?: 'popular' | 'following';

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  offset?: number;

  @ApiProperty({ example: 'sri lanka' })
  @IsString()
  @IsOptional()
  search_query?: string;
}

export class GetPostsResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: [PostDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostDto)
  posts: PostDto[];

  @ApiProperty({ example: 100 })
  @IsNumber()
  total: number;
}

export class GetPostByIdDto {
  @ApiProperty({ example: 'post123' })
  @IsString()
  post_id: string;
}

export class GetPostResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: PostDto })
  @ValidateNested()
  @Type(() => PostDto)
  post: PostDto;
}

export class UpdatePostDto {
  @ApiProperty({ example: 'post123' })
  @IsString()
  post_id: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: 'Updated caption' })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({ example: 'https://example.com/new-image.jpg' })
  @IsString()
  @IsOptional()
  image_url?: string;
}

export class UpdatePostResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Post updated successfully' })
  @IsString()
  message: string;

  @ApiProperty({ type: PostDto })
  @ValidateNested()
  @Type(() => PostDto)
  post: PostDto;
}

export class DeletePostDto {
  @ApiProperty({ example: 'post123' })
  @IsString()
  post_id: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;
}

export class DeletePostResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Post deleted successfully' })
  @IsString()
  message: string;
}

export class LikePostDto {
  @ApiProperty({ example: 'post123' })
  @IsString()
  post_id: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  like: boolean;
}

export class LikePostResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Like updated' })
  @IsString()
  message: string;

  @ApiProperty({ example: 150 })
  @IsNumber()
  like_count: number;
}

export class CommentPostDto {
  @ApiProperty({ example: 'post123' })
  @IsString()
  post_id: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: 'Great post!' })
  @IsString()
  @IsNotEmpty()
  comment: string;
}

export class CommentPostResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Comment added' })
  @IsString()
  message: string;

  @ApiProperty({ type: CommentDto })
  @ValidateNested()
  @Type(() => CommentDto)
  comment: CommentDto;
}

export class UserSummaryDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'Jacob Black' })
  @IsString()
  name: string;

  @ApiProperty({ example: '@jacobblack' })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'https://example.com/profile.jpg' })
  @IsString()
  @IsOptional()
  profile_image?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_following: boolean;
}

export class NotificationDto {
  @ApiProperty({ example: 'notif123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: 'like' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'You have a new like!' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Borg liked your post' })
  @IsString()
  message: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  is_read: boolean;

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  created_at: string;

  @ApiProperty({ example: 'post123' })
  @IsString()
  @IsOptional()
  related_id?: string;
}

export class ProfileDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: 'Travel enthusiast from Sri Lanka' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: 'https://example.com/profile.jpg' })
  @IsString()
  @IsOptional()
  profile_image?: string;

  @ApiProperty({ example: 12 })
  @IsNumber()
  post_count: number;

  @ApiProperty({ example: 125 })
  @IsNumber()
  follower_count: number;

  @ApiProperty({ example: 212 })
  @IsNumber()
  following_count: number;

  @ApiProperty({ type: [PostDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostDto)
  @IsOptional()
  posts?: PostDto[];
}

export class FollowUserDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  follower_id: string;

  @ApiProperty({ example: 'user456' })
  @IsString()
  followee_id: string;
}

export class FollowUserResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Followed successfully' })
  @IsString()
  message: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  is_following: boolean;
}

export class UnfollowUserDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  follower_id: string;

  @ApiProperty({ example: 'user456' })
  @IsString()
  followee_id: string;
}

export class GetFollowersDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class GetFollowersResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: [UserSummaryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserSummaryDto)
  followers: UserSummaryDto[];

  @ApiProperty({ example: 125 })
  @IsNumber()
  total: number;
}

export class GetFollowingDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class GetFollowingResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: [UserSummaryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserSummaryDto)
  following: UserSummaryDto[];

  @ApiProperty({ example: 212 })
  @IsNumber()
  total: number;
}

export class GetNotificationsDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: 'community', enum: ['community', 'trips', 'unread', 'missed'] })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class GetNotificationsResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: [NotificationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NotificationDto)
  notifications: NotificationDto[];

  @ApiProperty({ example: 5 })
  @IsNumber()
  total: number;
}

export class MarkNotificationAsReadDto {
  @ApiProperty({ example: 'notif123' })
  @IsString()
  notification_id: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;
}

export class MarkNotificationAsReadResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Marked as read' })
  @IsString()
  message: string;
}

export class GetProfileDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;
}

export class GetProfileResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: ProfileDto })
  @ValidateNested()
  @Type(() => ProfileDto)
  profile: ProfileDto;
}

export class UpdateProfileDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  user_id: string;

  @ApiProperty({ example: 'Travel enthusiast from Sri Lanka' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: 'https://example.com/new-profile.jpg' })
  @IsString()
  @IsOptional()
  profile_image?: string;
}

export class UpdateProfileResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ example: 'Profile updated' })
  @IsString()
  message: string;

  @ApiProperty({ type: ProfileDto })
  @ValidateNested()
  @Type(() => ProfileDto)
  profile: ProfileDto;
}

export class SearchPostsDto {
  @ApiProperty({ example: 'sri lanka' })
  @IsString()
  query: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class SearchPostsResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: [PostDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostDto)
  posts: PostDto[];

  @ApiProperty({ example: 20 })
  @IsNumber()
  total: number;
}

export class SearchUsersDto {
  @ApiProperty({ example: 'Jacob' })
  @IsString()
  query: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class SearchUsersResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: [UserSummaryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserSummaryDto)
  users: UserSummaryDto[];

  @ApiProperty({ example: 15 })
  @IsNumber()
  total: number;
}

// ... (continue for all other DTOs: FollowUserDto, etc.)