import { Body, Controller, Get, Post, Put, Delete, Param, Query, Req, UseGuards, HttpException, HttpStatus, Inject, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError } from 'rxjs';
import { ApiBearerAuth, ApiBadRequestResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Logger } from '@nestjs/common';
import {
  CreatePostDto, CreatePostResponseDto,
   GetPostsResponseDto,
  GetPostByIdDto, GetPostResponseDto,
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
  GetProfileDto, GetProfileResponseDto,
  UpdateProfileDto, UpdateProfileResponseDto,
  SearchPostsDto, SearchPostsResponseDto,
  SearchUsersDto, SearchUsersResponseDto,
  GetPostCommentsDto,
  GetPostCommentsResponseDto,
  GetPostLikersDto,
  GetPostLikersResponseDto,
  // Import all DTOs
} from './dtos/community.dto';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('Community')
@Controller('community')
export class CommunityServiceController {
  private communityService: any;
  private readonly logger = new Logger(CommunityServiceController.name);

  constructor(@Inject('COMMUNITY_PACKAGE') private client: ClientGrpcProxy) {
    this.communityService = this.client.getService('CommunityService');
  }

  @Post('media/upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Media file upload',
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Media file (JPEG, PNG, GIF, MP4)',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload media via gRPC to Backblaze B2' })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiBadRequestResponse({ description: 'Invalid file or upload failed' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during upload' })
  async uploadMedia(
    @UploadedFile() file: any,
    @Req() req: any,
  ): Promise<{ success: boolean; url: string; message: string }> {
    try {
      const userId = req?.user?.userId;
      if (!userId) {
        return { success: false, url: '', message: 'User not authenticated' };
      }

      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }

      // Validate file
      const allowedTypes = ['image/jpeg','image/jpg', 'image/png','image/avif','image/webp', 'image/gif', 'video/mp4'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new HttpException('Unsupported file type', HttpStatus.BAD_REQUEST);
      }

      // Prepare gRPC request (base64 encode buffer)
      const base64Data = file.buffer.toString('base64');
      const data: any = {
        userId: userId,
        fileData: Buffer.from(base64Data, 'base64'), // Reconstruct bytes
        fileName: file.originalname,
        contentType: file.mimetype,
      };

      const result = await firstValueFrom(
        this.communityService.UploadMedia(data).pipe(
          catchError((error) => {
            this.logger.error(`UploadMedia gRPC error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during upload', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid file data', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Upload failed', HttpStatus.BAD_REQUEST);
            }
          }),
        ),
      ) as any;

      return { success: result.success, url: result.url, message: result.message } as any;
    } catch (error: any) {
      this.logger.error(`UploadMedia failed: ${error.message}`, error.stack);
      throw error;
    }
  }


  @Post('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'Post created successfully', type: CreatePostResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid post data' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during post creation' })
  async createPost(@Body() dto: CreatePostDto, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data = { ...dto, userId: userId }; // Override with authenticated user

      const result = await firstValueFrom(
        this.communityService.CreatePost(data).pipe(
          catchError((error) => {
            this.logger.error(`CreatePost error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during post creation', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid post data', HttpStatus.BAD_REQUEST);
            } else if (error.details && error.details.includes('User not found')) {
              throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            } else {
              throw new HttpException('Post creation failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`CreatePost failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('public/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get public community post feed (latest first, searchable)' })
  @ApiResponse({ status: 200, description: 'Public posts fetched successfully', type: GetPostsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during public posts fetch' })
  async getPublicPosts(@Query() query: any, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      const data: any = {
        userId: userId, // No specific user
        feedType: undefined, // Default to latest (createdAt desc)
        limit: query.limit ? parseInt(query.limit, 10) : 10,
        offset: query.offset ? parseInt(query.offset, 10) : 0,
        searchQuery: query.q || query.search || '', // Support ?q= or ?search=
        currentUserId: userId, // Public: no current user, isFollowing=false
      };

      const result = await firstValueFrom(
        this.communityService.GetPosts(data).pipe(
          catchError((error: any) => {
            this.logger.error(`GetPublicPosts error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during public posts fetch', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid query parameters', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Public posts fetch failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetPublicPosts failed: ${error.message}`, error.stack);
      throw error;
    }
  }


  @Get('posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get posts' })
  @ApiResponse({ status: 200, description: 'Posts fetched successfully', type: GetPostsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during posts fetch' })
  async getPosts(@Query() dto: any, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data = { ...dto, userId: userId }; // Include authenticated user if needed

      const result = await firstValueFrom(
        this.communityService.GetPosts(data).pipe(
          catchError((error) => {
            this.logger.error(`GetPosts error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during posts fetch', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid query parameters', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Posts fetch failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetPosts failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get post by ID' })
  @ApiResponse({ status: 200, description: 'Post fetched successfully', type: GetPostResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid post ID' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during post fetch' })
  async getPostById(@Param('id') id: string, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data: GetPostByIdDto = { postId: id } as any;

      const result = await firstValueFrom(
        this.communityService.GetPostById(data).pipe(
          catchError((error) => {
            this.logger.error(`GetPostById error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during post fetch', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
            } else if (error.details && error.details.includes('Post not found')) {
              throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
            } else {
              throw new HttpException('Post fetch failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetPostById failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update post' })
  @ApiResponse({ status: 200, description: 'Post updated successfully', type: UpdatePostResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid post data' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during post update' })
  async updatePost(@Param('id') id: string, @Body() dto: Omit<UpdatePostDto, 'postId'>, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data: UpdatePostDto = { ...dto, postId: id, userId: userId } as any;

      const result = await firstValueFrom(
        this.communityService.UpdatePost(data).pipe(
          catchError((error) => {
            this.logger.error(`UpdatePost error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during post update', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid post data', HttpStatus.BAD_REQUEST);
            } else if (error.details && error.details.includes('Post not found')) {
              throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
            } else {
              throw new HttpException('Post update failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`UpdatePost failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete('posts/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete post' })
  @ApiResponse({ status: 200, description: 'Post deleted successfully', type: DeletePostResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid post ID' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during post deletion' })
  async deletePost(@Param('id') id: string, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data: DeletePostDto = { postId: id, userId: userId } as any;

      const result = await firstValueFrom(
        this.communityService.DeletePost(data).pipe(
          catchError((error) => {
            this.logger.error(`DeletePost error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during post deletion', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
            } else if (error.details && error.details.includes('Post not found')) {
              throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
            } else {
              throw new HttpException('Post deletion failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`DeletePost failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('posts/:id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like or unlike post' })
  @ApiResponse({ status: 200, description: 'Like updated successfully', type: LikePostResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid post ID' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during like update' })
  async likePost(@Param('id') id: string, @Body() dto: LikePostDto, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data = { ...dto, postId: id, userId: userId } as any;

      const result = await firstValueFrom(
        this.communityService.LikePost(data).pipe(
          catchError((error) => {
            this.logger.error(`LikePost error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during like update', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
            } else if (error.details && error.details.includes('Post not found')) {
              throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
            } else {
              throw new HttpException('Like update failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`LikePost failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('posts/:id/comment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add comment to post' })
  @ApiResponse({ status: 201, description: 'Comment added successfully', type: CommentPostResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid comment data' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during comment addition' })
  async commentPost(@Param('id') id: string, @Body() dto: CommentPostDto, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data: any = { ...dto, postId: id, userId: userId };

      const result = await firstValueFrom(
        this.communityService.CommentPost(data).pipe(
          catchError((error) => {
            this.logger.error(`CommentPost error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during comment addition', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid comment data', HttpStatus.BAD_REQUEST);
            } else if (error.details && error.details.includes('Post not found')) {
              throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
            } else {
              throw new HttpException('Comment addition failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`CommentPost failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('posts/:id/likes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get post likers with details (name, avatar, follow status)' })
@ApiResponse({ status: 200, description: 'Likers fetched', type: GetPostLikersResponseDto })
@ApiBadRequestResponse({ description: 'Invalid post ID' })
@ApiNotFoundResponse({ description: 'Post not found' })
async getPostLikers(
  @Param('id') id: string,
  @Query() query: Omit<GetPostLikersDto, 'postId'>,
  @Req() req: any,
) {
  try {
    const currentUserId = req?.user?.userId;
    if (!currentUserId) return { success: false, message: 'User not authenticated' };

    const data: GetPostLikersDto = { postId: id, currentUserId, ...query } as any;

    const result = await firstValueFrom(
      this.communityService.GetPostLikers(data).pipe(
        catchError((error) => {
          this.logger.error(`GetPostLikers error: ${error.message}`, error.stack);
          if (error.code === 2 || error.code === 'INTERNAL') {
            throw new HttpException('Internal server error during likers fetch', HttpStatus.INTERNAL_SERVER_ERROR);
          } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
            throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
          } else if (error.details && error.details.includes('Post not found')) {
            throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
          } else {
            throw new HttpException('Likers fetch failed', HttpStatus.BAD_REQUEST);
          }
        })
      )
    );
    return result;
  } catch (error: any) {
    this.logger.error(`GetPostLikers failed: ${error.message}`, error.stack);
    throw error;
  }
}

  @Get('posts/:id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get post comments with commenter details (name, avatar, follow status)' })
  @ApiResponse({ status: 200, description: 'Comments fetched', type: GetPostCommentsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid post ID' })
  @ApiNotFoundResponse({ description: 'Post not found' })
  async getPostComments(
    @Param('id') id: string,
    @Query() query: Omit<GetPostCommentsDto, 'postId'>,
    @Req() req: any,
  ) {
    try {
      const currentUserId = req?.user?.userId;
      if (!currentUserId) return { success: false, message: 'User not authenticated' };

      const data: GetPostCommentsDto = { postId: id, currentUserId, ...query } as any;

      const result = await firstValueFrom(
        this.communityService.GetPostComments(data).pipe(
          catchError((error) => {
            this.logger.error(`GetPostComments error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during comments fetch', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid post ID', HttpStatus.BAD_REQUEST);
            } else if (error.details && error.details.includes('Post not found')) {
              throw new HttpException('Post not found', HttpStatus.NOT_FOUND);
            } else {
              throw new HttpException('Comments fetch failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetPostComments failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('follow/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Follow user' })
  @ApiResponse({ status: 200, description: 'User followed successfully', type: FollowUserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid user ID' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during follow' })
  async followUser(@Param('userId') userId: string, @Req() req: any) {
    try {
      const currentUserId = req?.user?.userId;
      if (!currentUserId) return { success: false, message: 'User not authenticated' };

      const data: FollowUserDto = { followerId: currentUserId, followeeId: userId } as any;

      const result = await firstValueFrom(
        this.communityService.FollowUser(data).pipe(
          catchError((error) => {
            this.logger.error(`FollowUser error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during follow', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Follow failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`FollowUser failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Delete('follow/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unfollow user' })
  @ApiResponse({ status: 200, description: 'User unfollowed successfully', type: FollowUserResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid user ID' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during unfollow' })
  async unfollowUser(@Param('userId') userId: string, @Req() req: any) {
    try {
      const currentUserId = req?.user?.userId;
      if (!currentUserId) return { success: false, message: 'User not authenticated' };

      const data: UnfollowUserDto = { followerId: currentUserId, followeeId: userId } as any;

      const result = await firstValueFrom(
        this.communityService.UnfollowUser(data).pipe(
          catchError((error) => {
            this.logger.error(`UnfollowUser error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during unfollow', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Unfollow failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`UnfollowUser failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('followers/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get followers' })
  @ApiResponse({ status: 200, description: 'Followers fetched successfully', type: GetFollowersResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid user ID' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during followers fetch' })
  async getFollowers(@Param('userId') userId: string, @Query() dto: Omit<GetFollowersDto, 'userId'>, @Req() req: any) {
    try {
      const currentUserId = req?.user?.userId;
      if (!currentUserId) return { success: false, message: 'User not authenticated' };

      const data: GetFollowersDto = { ...dto, userId: userId } as any;

      const result = await firstValueFrom(
        this.communityService.GetFollowers(data).pipe(
          catchError((error) => {
            this.logger.error(`GetFollowers error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during followers fetch', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Followers fetch failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetFollowers failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('following/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get following' })
  @ApiResponse({ status: 200, description: 'Following fetched successfully', type: GetFollowingResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid user ID' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during following fetch' })
  async getFollowing(@Param('userId') userId: string, @Query() dto: Omit<GetFollowingDto, 'userId'>, @Req() req: any) {
    try {
      const currentUserId = req?.user?.userId;
      if (!currentUserId) return { success: false, message: 'User not authenticated' };

      const data: GetFollowingDto = { ...dto, userId: userId } as any;

      const result = await firstValueFrom(
        this.communityService.GetFollowing(data).pipe(
          catchError((error) => {
            this.logger.error(`GetFollowing error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during following fetch', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Following fetch failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetFollowing failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('notifications')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notifications' })
  @ApiResponse({ status: 200, description: 'Notifications fetched successfully', type: GetNotificationsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during notifications fetch' })
  async getNotifications(@Query() dto: GetNotificationsDto, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data = { ...dto, userId: userId };

      const result = await firstValueFrom(
        this.communityService.GetNotifications(data).pipe(
          catchError((error) => {
            this.logger.error(`GetNotifications error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during notifications fetch', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid query parameters', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Notifications fetch failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetNotifications failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put('notifications/:id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read', type: MarkNotificationAsReadResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid notification ID' })
  @ApiNotFoundResponse({ description: 'Notification not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during marking read' })
  async markNotificationAsRead(@Param('id') id: string, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data: MarkNotificationAsReadDto = { notificationId: id, userId: userId } as any;

      const result = await firstValueFrom(
        this.communityService.MarkNotificationAsRead(data).pipe(
          catchError((error) => {
            this.logger.error(`MarkNotificationAsRead error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during marking read', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid notification ID', HttpStatus.BAD_REQUEST);
            } else if (error.details && error.details.includes('Notification not found')) {
              throw new HttpException('Notification not found', HttpStatus.NOT_FOUND);
            } else {
              throw new HttpException('Marking read failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`MarkNotificationAsRead failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('profile/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get profile' })
  @ApiResponse({ status: 200, description: 'Profile fetched successfully', type: GetProfileResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid user ID' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during profile fetch' })
  async getProfile(@Param('userId') userId: string, @Req() req: any) {
    try {
      const currentUserId = req?.user?.userId;
      if (!currentUserId) return { success: false, message: 'User not authenticated' };

      const data: GetProfileDto = { userId: userId } as any;

      const result = await firstValueFrom(
        this.communityService.GetProfile(data).pipe(
          catchError((error) => {
            this.logger.error(`GetProfile error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during profile fetch', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
            } else if (error.details && error.details.includes('User not found')) {
              throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            } else {
              throw new HttpException('Profile fetch failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetProfile failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully', type: UpdateProfileResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid profile data' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during profile update' })
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data = { ...dto, userId: userId };

      const result = await firstValueFrom(
        this.communityService.UpdateProfile(data).pipe(
          catchError((error) => {
            this.logger.error(`UpdateProfile error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during profile update', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid profile data', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Profile update failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`UpdateProfile failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('search/posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search posts' })
  @ApiResponse({ status: 200, description: 'Posts search results', type: SearchPostsResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid search query' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during search' })
  async searchPosts(@Query() dto: SearchPostsDto, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data = { ...dto };

      const result = await firstValueFrom(
        this.communityService.SearchPosts(data).pipe(
          catchError((error) => {
            this.logger.error(`SearchPosts error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during search', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid search query', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Search failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`SearchPosts failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('search/users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search users' })
  @ApiResponse({ status: 200, description: 'Users search results', type: SearchUsersResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid search query' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during search' })
  async searchUsers(@Query() dto: SearchUsersDto, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data = { ...dto };

      const result = await firstValueFrom(
        this.communityService.SearchUsers(data).pipe(
          catchError((error) => {
            this.logger.error(`SearchUsers error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during search', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid search query', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Search failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`SearchUsers failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}