// community.controller.ts (updated to use DTOs - assuming HTTP for simplicity, or keep gRPC with DTO typing)
import { Body, Controller, Get, Post, Put, Delete, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CommunityService } from './community.service';
import {
  CreatePostDto, CreatePostResponseDto,
  GetPostsDto, GetPostsResponseDto,GetPostResponseDto,
  UpdatePostDto, UpdatePostResponseDto,
  DeletePostDto, DeletePostResponseDto,
  LikePostDto, LikePostResponseDto,
  CommentPostDto, CommentPostResponseDto,
  FollowUserDto, FollowUserResponseDto,
  UnfollowUserDto,
  GetFollowersDto, GetFollowersResponseDto,
  GetFollowingDto, GetFollowingResponseDto,
  GetNotificationsDto, GetNotificationsResponseDto,
  MarkNotificationAsReadDto, MarkNotificationAsReadResponseDto,
   GetProfileResponseDto,
  UpdateProfileDto, UpdateProfileResponseDto,
  SearchPostsDto, SearchPostsResponseDto,
  SearchUsersDto, SearchUsersResponseDto,
  // Import all other DTOs
} from './dtos/post.dto';

@ApiTags('Community')
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('posts')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, type: CreatePostResponseDto })
  async createPost(@Body() data: CreatePostDto): Promise<CreatePostResponseDto> {
    return this.communityService.createPost(data);
  }

  @Get('posts')
  @ApiOperation({ summary: 'Get posts' })
  @ApiResponse({ status: 200, type: GetPostsResponseDto })
  async getPosts(@Query() data: GetPostsDto): Promise<GetPostsResponseDto> {
    return this.communityService.getPosts(data);
  }

  @Get('posts/:id')
  @ApiOperation({ summary: 'Get post by ID' })
  async getPostById(@Param('id') id: string): Promise<GetPostResponseDto> {
    return this.communityService.getPostById({ post_id: id });
  }

  @Put('posts/:id')
  @ApiOperation({ summary: 'Update post' })
  async updatePost(@Param('id') id: string, @Body() data: Omit<UpdatePostDto, 'post_id'>): Promise<UpdatePostResponseDto> {
    return this.communityService.updatePost({ ...data, post_id: id });
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete post' })
  async deletePost(@Param('id') id: string, @Body() data: Omit<DeletePostDto, 'post_id'>): Promise<DeletePostResponseDto> {
    return this.communityService.deletePost({ ...data, post_id: id });
  }

  @Post('posts/:id/like')
  @ApiOperation({ summary: 'Like or unlike post' })
  async likePost(@Param('id') id: string, @Body() data: Omit<LikePostDto, 'post_id'>): Promise<LikePostResponseDto> {
    return this.communityService.likePost({ ...data, post_id: id });
  }

  @Post('posts/:id/comment')
  @ApiOperation({ summary: 'Add comment to post' })
  async commentPost(@Param('id') id: string, @Body() data: Omit<CommentPostDto, 'post_id'>): Promise<CommentPostResponseDto> {
    return this.communityService.commentPost({ ...data, post_id: id });
  }

  @Post('follow/:userId')
  @ApiOperation({ summary: 'Follow user' })
  async followUser(@Param('userId') userId: string, @Body() data: Omit<FollowUserDto, 'followee_id'>): Promise<FollowUserResponseDto> {
    return this.communityService.followUser({ ...data, followee_id: userId });
  }

  @Delete('follow/:userId')
  @ApiOperation({ summary: 'Unfollow user' })
  async unfollowUser(@Param('userId') userId: string, @Body() data: Omit<UnfollowUserDto, 'followee_id'>): Promise<FollowUserResponseDto> {
    return this.communityService.unfollowUser({ ...data, followee_id: userId });
  }

  @Get('followers/:userId')
  @ApiOperation({ summary: 'Get followers' })
  async getFollowers(@Param('userId') userId: string, @Query() data: GetFollowersDto): Promise<GetFollowersResponseDto> {
    return this.communityService.getFollowers({ ...data, user_id: userId });
  }

  @Get('following/:userId')
  @ApiOperation({ summary: 'Get following' })
  async getFollowing(@Param('userId') userId: string, @Query() data: GetFollowingDto): Promise<GetFollowingResponseDto> {
    return this.communityService.getFollowing({ ...data, user_id: userId });
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Get notifications' })
  async getNotifications(@Query() data: GetNotificationsDto): Promise<GetNotificationsResponseDto> {
    return this.communityService.getNotifications(data);
  }

  @Put('notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markNotificationAsRead(@Param('id') id: string, @Body() data: Omit<MarkNotificationAsReadDto, 'notification_id'>): Promise<MarkNotificationAsReadResponseDto> {
    return this.communityService.markNotificationAsRead({ ...data, notification_id: id });
  }

  @Get('profile/:userId')
  @ApiOperation({ summary: 'Get profile' })
  async getProfile(@Param('userId') userId: string): Promise<GetProfileResponseDto> {
    return this.communityService.getProfile({ user_id: userId });
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update profile' })
  async updateProfile(@Body() data: UpdateProfileDto): Promise<UpdateProfileResponseDto> {
    return this.communityService.updateProfile(data);
  }

  @Get('search/posts')
  @ApiOperation({ summary: 'Search posts' })
  async searchPosts(@Query() data: SearchPostsDto): Promise<SearchPostsResponseDto> {
    return this.communityService.searchPosts(data);
  }

  @Get('search/users')
  @ApiOperation({ summary: 'Search users' })
  async searchUsers(@Query() data: SearchUsersDto): Promise<SearchUsersResponseDto> {
    return this.communityService.searchUsers(data);
  }
}