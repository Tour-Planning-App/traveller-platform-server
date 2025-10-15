// community.controller.ts (updated to use DTOs - assuming HTTP for simplicity, or keep gRPC with DTO typing)
import {  Controller, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
import { GrpcMethod, Payload, RpcException } from '@nestjs/microservices';
import { MediaService } from './media.service';

@ApiTags('Community')
@Controller()
export class CommunityController {
  private readonly logger = new Logger(CommunityController.name);

  constructor(
    private readonly communityService: CommunityService,
    private readonly mediaService: MediaService,
  ) {}

  @GrpcMethod('CommunityService', 'CreatePost')
  async createPost(@Payload() data: CreatePostDto): Promise<CreatePostResponseDto> {
    try {
      const result = await this.communityService.createPost(data);
      return {
        success: result.success,
        message: result.message,
        post: result.post,
      };
    } catch (error: any) {
      this.logger.error(`gRPC CreatePost error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'GetPosts')
  async getPosts(@Payload() data: GetPostsDto): Promise<GetPostsResponseDto> {
    try {
      const result = await this.communityService.getPosts(data);
      return {
        success: result.success,
        posts: result.posts,
        total: result.total,
      };
    } catch (error: any) {
      this.logger.error(`gRPC GetPosts error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'GetPostById')
  async getPostById(@Payload() data: any): Promise<GetPostResponseDto> {
    try {
      const result = await this.communityService.getPostById(data);
      return {
        success: result.success,
        post: result.post,
      };
    } catch (error: any) {
      this.logger.error(`gRPC GetPostById error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'UpdatePost')
  async updatePost(@Payload() data: UpdatePostDto): Promise<UpdatePostResponseDto> {
    try {
      const result = await this.communityService.updatePost(data);
      return {
        success: result.success,
        message: result.message,
        post: result.post,
      };
    } catch (error: any) {
      this.logger.error(`gRPC UpdatePost error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'DeletePost')
  async deletePost(@Payload() data: DeletePostDto): Promise<DeletePostResponseDto> {
    try {
      const result = await this.communityService.deletePost(data);
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error: any) {
      this.logger.error(`gRPC DeletePost error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'LikePost')
  async likePost(@Payload() data: LikePostDto): Promise<LikePostResponseDto> {
    try {
      const result = await this.communityService.likePost(data);
      return {
        success: result.success,
        message: result.message,
        likeCount: result.likeCount,
      };
    } catch (error: any) {
      this.logger.error(`gRPC LikePost error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'CommentPost')
  async commentPost(@Payload() data: CommentPostDto): Promise<CommentPostResponseDto> {
    try {
      const result = await this.communityService.commentPost(data);
      return {
        success: result.success,
        message: result.message,
        comment: result.comment,
      };
    } catch (error: any) {
      this.logger.error(`gRPC CommentPost error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'FollowUser')
  async followUser(@Payload() data: FollowUserDto): Promise<FollowUserResponseDto> {
    try {
      const result = await this.communityService.followUser(data);
      return {
        success: result.success,
        message: result.message,
        isFollowing: result.isFollowing,
      };
    } catch (error: any) {
      this.logger.error(`gRPC FollowUser error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'UnfollowUser')
  async unfollowUser(@Payload() data: UnfollowUserDto): Promise<FollowUserResponseDto> {
    try {
      const result = await this.communityService.unfollowUser(data);
      return {
        success: result.success,
        message: result.message,
        isFollowing: result.isFollowing,
      };
    } catch (error: any) {
      this.logger.error(`gRPC UnfollowUser error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'GetFollowers')
  async getFollowers(@Payload() data: GetFollowersDto): Promise<GetFollowersResponseDto> {
    try {
      const result = await this.communityService.getFollowers(data);
      return {
        success: result.success,
        followers: result.followers,
        total: result.total,
      };
    } catch (error: any) {
      this.logger.error(`gRPC GetFollowers error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'GetFollowing')
  async getFollowing(@Payload() data: GetFollowingDto): Promise<GetFollowingResponseDto> {
    try {
      const result = await this.communityService.getFollowing(data);
      return {
        success: result.success,
        following: result.following,
        total: result.total,
      };
    } catch (error: any) {
      this.logger.error(`gRPC GetFollowing error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'GetNotifications')
  async getNotifications(@Payload() data: GetNotificationsDto): Promise<GetNotificationsResponseDto> {
    try {
      const result = await this.communityService.getNotifications(data);
      return {
        success: result.success,
        notifications: result.notifications,
        total: result.total,
      };
    } catch (error: any) {
      this.logger.error(`gRPC GetNotifications error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'MarkNotificationAsRead')
  async markNotificationAsRead(@Payload() data: MarkNotificationAsReadDto): Promise<MarkNotificationAsReadResponseDto> {
    try {
      const result = await this.communityService.markNotificationAsRead(data);
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error: any) {
      this.logger.error(`gRPC MarkNotificationAsRead error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'GetProfile')
  async getProfile(@Payload() data: any): Promise<GetProfileResponseDto> {
    try {
      const result = await this.communityService.getProfile(data);
      return {
        success: result.success,
        profile: result.profile,
      };
    } catch (error: any) {
      this.logger.error(`gRPC GetProfile error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'UpdateProfile')
  async updateProfile(@Payload() data: UpdateProfileDto): Promise<UpdateProfileResponseDto> {
    try {
      const result = await this.communityService.updateProfile(data);
      return {
        success: result.success,
        message: result.message,
        profile: result.profile,
      };
    } catch (error: any) {
      this.logger.error(`gRPC UpdateProfile error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'SearchPosts')
  async searchPosts(@Payload() data: SearchPostsDto): Promise<SearchPostsResponseDto> {
    try {
      const result = await this.communityService.searchPosts(data);
      return {
        success: result.success,
        posts: result.posts,
        total: result.total,
      };
    } catch (error: any) {
      this.logger.error(`gRPC SearchPosts error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'SearchUsers')
  async searchUsers(@Payload() data: SearchUsersDto): Promise<SearchUsersResponseDto> {
    try {
      const result = await this.communityService.searchUsers(data);
      return {
        success: result.success,
        users: result.users,
        total: result.total,
      };
    } catch (error: any) {
      this.logger.error(`gRPC SearchUsers error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('CommunityService', 'UploadMedia')
  async uploadMedia(@Payload() data: any): Promise<any> {
    try {
      const buffer = Buffer.from(data.fileData);
      const url = await this.mediaService.uploadFile(
        buffer,
        data.fileName,
        data.contentType,
      );
      return { success: true, message: 'Upload successful', url };
    } catch (error: any) {
      this.logger.error(`gRPC UploadMedia error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }
}