// dtos/post.dto.ts (updated with searchQuery and currentUserId in GetPostsDto, enhanced PostDto for public feed)
import { IsString, IsOptional, IsArray, IsNumber, IsBoolean, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LikeDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  createdAt: string;
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
  profileImage?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isFollowing: boolean;
}

export class CommentDto {
  @ApiProperty({ example: 'comment123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'post123' })
  @IsString()
  postId: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Great post!' })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  createdAt: string;
}

export class DetailedCommentDto {
  @ApiProperty({ type: CommentDto })
  @ValidateNested()
  @Type(() => CommentDto)
  comment: CommentDto;

  @ApiProperty({ type: UserSummaryDto })
  @ValidateNested()
  @Type(() => UserSummaryDto)
  user: UserSummaryDto;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isFollowing?: boolean;
}

export class GetPostCommentsDto {
  @ApiProperty({ example: 'post123' })
  @IsString()
  postId: string;

  @ApiProperty({ example: 'user123' }) // Current user for isFollowing
  @IsString()
  @IsOptional()
  currentUserId?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class GetPostCommentsResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: [DetailedCommentDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetailedCommentDto)
  comments: DetailedCommentDto[];

  @ApiProperty({ example: 5 })
  @IsNumber()
  total: number;
}

export class GetPostLikersDto {
  @ApiProperty({ example: 'post123' })
  @IsString()
  postId: string;

  @ApiProperty({ example: 'user123' }) // Current user for isFollowing
  @IsString()
  @IsOptional()
  currentUserId?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ example: 0 })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

export class GetPostLikersResponseDto {
  @ApiProperty({ example: true })
  @IsBoolean()
  success: boolean;

  @ApiProperty({ type: [UserSummaryDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserSummaryDto)
  likers: UserSummaryDto[];

  @ApiProperty({ example: 150 })
  @IsNumber()
  total: number;
}

// Updated PostDto for feed: added user summary, commentsCount; likes and comments arrays optional for feed efficiency
export class PostDto {
  @ApiProperty({ example: 'post123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;

  @ApiProperty({ type: UserSummaryDto })
  @ValidateNested()
  @Type(() => UserSummaryDto)
  @IsOptional()
  user?: UserSummaryDto;

  @ApiProperty({ example: 'Amazing trip to Sri Lanka!' })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: ['#srilanka', '#travel'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: 150 })
  @IsNumber()
  likeCount: number;

  @ApiProperty({ example: 5 })
  @IsNumber()
  @IsOptional()
  commentsCount?: number;

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
  createdAt: string;

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  updatedAt: string;
}

export class CreatePostDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Amazing trip to Sri Lanka!' })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ example: ['#srilanka', '#travel'] })
  @IsArray()
  @IsOptional()
  tags?: string[];

  @ApiProperty({ example: '192.168.1.1', required: false })
  @IsString()
  @IsOptional()
  ipAddress?: string;
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
  userId?: string;

  @ApiProperty({ example: 'popular', enum: ['popular', 'following'] })
  @IsString()
  @IsOptional()
  feedType?: 'popular' | 'following';

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
  searchQuery?: string;

  @ApiProperty({ example: 'currentUser123', required: false })
  @IsString()
  @IsOptional()
  currentUserId?: string; // For computing isFollowing
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
  postId: string;
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
  postId: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Updated caption' })
  @IsString()
  @IsOptional()
  caption?: string;

  @ApiProperty({ example: 'https://example.com/new-image.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
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
  postId: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;
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
  postId: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;

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
  likeCount: number;
}

export class CommentPostDto {
  @ApiProperty({ example: 'post123' })
  @IsString()
  postId: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;

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

export class NotificationDto {
  @ApiProperty({ example: 'notif123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;

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
  isRead: boolean;

  @ApiProperty({ example: '2023-10-01T00:00:00Z' })
  @IsString()
  createdAt: string;

  @ApiProperty({ example: 'post123' })
  @IsString()
  @IsOptional()
  relatedId?: string;
}

export class ProfileDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  id: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;

  @ApiProperty({ example: 'Travel enthusiast from Sri Lanka' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: 'https://example.com/profile.jpg' })
  @IsString()
  @IsOptional()
  profileImage?: string;

  @ApiProperty({ example: 12 })
  @IsNumber()
  postCount: number;

  @ApiProperty({ example: 125 })
  @IsNumber()
  followerCount: number;

  @ApiProperty({ example: 212 })
  @IsNumber()
  followingCount: number;

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
  followerId: string;

  @ApiProperty({ example: 'user456' })
  @IsString()
  followeeId: string;
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
  isFollowing: boolean;
}

export class UnfollowUserDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  followerId: string;

  @ApiProperty({ example: 'user456' })
  @IsString()
  followeeId: string;
}

export class GetFollowersDto {
  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;

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
  userId: string;

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
  userId: string;

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
  notificationId: string;

  @ApiProperty({ example: 'user123' })
  @IsString()
  userId: string;
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
  userId: string;
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
  userId: string;

  @ApiProperty({ example: 'Travel enthusiast from Sri Lanka' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiProperty({ example: 'https://example.com/new-profile.jpg' })
  @IsString()
  @IsOptional()
  profileImage?: string;
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