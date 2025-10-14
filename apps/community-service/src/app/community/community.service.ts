// community.service.ts (complete with all methods)
import { Inject, Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Post } from './schemas/post.schema';
import { Notification } from './schemas/notification.schema';
import { Follow } from './schemas/follow.schema';
import {
  CreatePostDto, CreatePostResponseDto,
  GetPostsDto, GetPostsResponseDto,
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
  // Import all other DTOs
} from './dtos/post.dto'; // Assuming all in one file or import accordingly

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);
  private userService: any;

  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(Follow.name) private followModel: Model<Follow>,
    @Inject('USER_PACKAGE') private userClient: ClientGrpcProxy,
  ) {
    this.userService = this.userClient.getService('UserService');
  }

  async createPost(data: CreatePostDto): Promise<CreatePostResponseDto> {
    try {
      // Verify user exists via UserService gRPC
      const user = await firstValueFrom(this.userService.GetUserById({ id: data.user_id })) as any;
      if (!user.data) {
        throw new NotFoundException('User not found');
      }

      const post = new this.postModel({
        ...data,
        user_id: data.user_id,
        like_count: 0,
        likes: [],
        comments: [],
      });
      await post.save();

      // Emit Kafka event for post creation (e.g., notify followers)
      // Assuming Kafka client is injected or handled elsewhere
      // this.kafkaClient.emit('post.created', { postId: post.id, userId: data.user_id });

      return { success: true, message: 'Post created', post: post.toObject() } as any;
    } catch (error) {
      this.logger.error(`CreatePost error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async getPosts(data: GetPostsDto): Promise<GetPostsResponseDto> {
    try {
      let query: any = {};
      if (data.user_id) query.user_id = data.user_id;
      if (data.feed_type === 'following') {
        // Fetch following users via follow model and aggregate
        const following = await this.followModel.find({ follower_id: data.user_id }).select('followee_id');
        const followeeIds = following.map(f => f.followee_id);
        if (followeeIds.length === 0) {
          return { success: true, posts: [], total: 0 };
        }
        query.user_id = { $in: followeeIds };
      }
      // For popular, sort by like_count descending, then created_at
      const sortQuery = data.feed_type === 'popular' 
        ? { like_count: -1, created_at: -1 } 
        : { created_at: -1 } as any;

      const posts = await this.postModel
        .find(query)
        .sort(sortQuery)
        .limit(data.limit || 10)
        .skip(data.offset || 0)
        .populate('user_id', 'name profile_image') // Assuming ref to user in schema
        .exec();

      const total = await this.postModel.countDocuments(query);

      return { success: true, posts, total } as any;
    } catch (error) {
      this.logger.error(`GetPosts error: ${error.message}`);
      throw new BadRequestException('Failed to fetch posts');
    }
  }

  async getPostById(data: GetPostByIdDto): Promise<GetPostResponseDto> {
    try {
      const post = await this.postModel
        .findById(data.post_id)
        .populate('user_id', 'name profile_image')
        .populate({
          path: 'comments',
          populate: { path: 'user_id', select: 'name profile_image' }
        })
        .exec();

      if (!post) {
        throw new NotFoundException('Post not found');
      }

      return { success: true, post } as any;
    } catch (error) {
      this.logger.error(`GetPostById error: ${error.message}`);
      throw new BadRequestException('Failed to fetch post');
    }
  }

  async updatePost(data: UpdatePostDto): Promise<UpdatePostResponseDto> {
    try {
      const post = await this.postModel.findOneAndUpdate(
        { _id: data.post_id, user_id: data.user_id },
        { $set: { caption: data.caption, image_url: data.image_url } },
        { new: true }
      ).populate('user_id', 'name profile_image').exec();

      if (!post) {
        throw new NotFoundException('Post not found or unauthorized');
      }

      return { success: true, message: 'Post updated', post } as any;
    } catch (error) {
      this.logger.error(`UpdatePost error: ${error.message}`);
      throw new BadRequestException('Failed to update post');
    }
  }

  async deletePost(data: DeletePostDto): Promise<DeletePostResponseDto> {
    try {
      const post = await this.postModel.findOneAndDelete({ _id: data.post_id, user_id: data.user_id });
      if (!post) {
        throw new NotFoundException('Post not found or unauthorized');
      }

      // Emit Kafka event for post deletion
      // this.kafkaClient.emit('post.deleted', { postId: data.post_id });

      return { success: true, message: 'Post deleted' };
    } catch (error) {
      this.logger.error(`DeletePost error: ${error.message}`);
      throw new BadRequestException('Failed to delete post');
    }
  }

  async likePost(data: LikePostDto): Promise<LikePostResponseDto> {
    try {
      const post = await this.postModel.findById(data.post_id) as any;
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      const existingLikeIndex = post.likes.findIndex(l => l.user_id === data.user_id);
      if (data.like) {
        if (existingLikeIndex === -1) {
          post.likes.push({ user_id: data.user_id, created_at: new Date().toISOString() });
          post.like_count += 1;
        }
      } else {
        if (existingLikeIndex !== -1) {
          post.likes.splice(existingLikeIndex, 1);
          post.like_count -= 1;
        }
      }
      await post.save();

      // Emit Kafka event for like notification
      // this.kafkaClient.emit('post.liked', { postId: data.post_id, userId: data.user_id, action: data.like ? 'liked' : 'unliked' });

      return { success: true, message: 'Like updated', like_count: post.like_count };
    } catch (error) {
      this.logger.error(`LikePost error: ${error.message}`);
      throw new BadRequestException('Failed to update like');
    }
  }

  async commentPost(data: CommentPostDto): Promise<CommentPostResponseDto> {
    try {
      const post = await this.postModel.findById(data.post_id);
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Assuming a separate Comment model; for simplicity, add to post.comments array
      const newComment = {
        id: new Date().getTime().toString(), // Simple ID
        user_id: data.user_id,
        text: data.comment,
        created_at: new Date().toISOString(),
      } as any;
      post.comments.push(newComment);
      await post.save();

      // Emit Kafka event for comment notification
      // this.kafkaClient.emit('post.commented', { postId: data.post_id, userId: data.user_id, commentId: newComment.id });

      return { success: true, message: 'Comment added', comment: newComment };
    } catch (error) {
      this.logger.error(`CommentPost error: ${error.message}`);
      throw new BadRequestException('Failed to add comment');
    }
  }

  async followUser(data: FollowUserDto): Promise<FollowUserResponseDto> {
    try {
      let follow = await this.followModel.findOne({ follower_id: data.follower_id, followee_id: data.followee_id });
      if (follow) {
        return { success: false, message: 'Already following', is_following: true };
      }

      follow = new this.followModel({
        follower_id: data.follower_id,
        followee_id: data.followee_id,
      });
      await follow.save();

      // Emit Kafka event for follow notification
      // this.kafkaClient.emit('user.followed', { followerId: data.follower_id, followeeId: data.followee_id });

      return { success: true, message: 'Followed', is_following: true };
    } catch (error) {
      this.logger.error(`FollowUser error: ${error.message}`);
      throw new BadRequestException('Failed to follow user');
    }
  }

  async unfollowUser(data: UnfollowUserDto): Promise<FollowUserResponseDto> {
    try {
      const follow = await this.followModel.findOneAndDelete({
        follower_id: data.follower_id,
        followee_id: data.followee_id,
      });
      if (!follow) {
        return { success: false, message: 'Not following', is_following: false };
      }

      // Emit Kafka event for unfollow
      // this.kafkaClient.emit('user.unfollowed', { followerId: data.follower_id, followeeId: data.followee_id });

      return { success: true, message: 'Unfollowed', is_following: false };
    } catch (error) {
      this.logger.error(`UnfollowUser error: ${error.message}`);
      throw new BadRequestException('Failed to unfollow user');
    }
  }

  async getFollowers(data: GetFollowersDto): Promise<GetFollowersResponseDto> {
    try {
      const followers = await this.followModel
        .find({ followee_id: data.user_id })
        .populate('follower_id', 'name profile_image username')
        .limit(data.limit || 10)
        .skip(data.offset || 0)
        .exec() as any;

      const total = await this.followModel.countDocuments({ followee_id: data.user_id });

      const followerSummaries = followers.map(f => ({
        id: f.follower_id._id,
        name: f.follower_id.name,
        username: f.follower_id.username,
        profile_image: f.follower_id.profile_image,
        is_following: true, // Since they follow you
      })) ;

      return { success: true, followers: followerSummaries, total };
    } catch (error) {
      this.logger.error(`GetFollowers error: ${error.message}`);
      throw new BadRequestException('Failed to fetch followers');
    }
  }

  async getFollowing(data: GetFollowingDto): Promise<GetFollowingResponseDto> {
    try {
      const following = await this.followModel
        .find({ follower_id: data.user_id })
        .populate('followee_id', 'name profile_image username')
        .limit(data.limit || 10)
        .skip(data.offset || 0)
        .exec() as any;

      const total = await this.followModel.countDocuments({ follower_id: data.user_id });

      const followingSummaries = following.map(f => ({
        id: f.followee_id._id,
        name: f.followee_id.name,
        username: f.followee_id.username,
        profile_image: f.followee_id.profile_image,
        is_following: true,
      }));

      return { success: true, following: followingSummaries, total };
    } catch (error) {
      this.logger.error(`GetFollowing error: ${error.message}`);
      throw new BadRequestException('Failed to fetch following');
    }
  }

  async getNotifications(data: GetNotificationsDto): Promise<GetNotificationsResponseDto> {
    try {
      let query: any = { user_id: data.user_id };
      if (data.type) query.type = data.type;

      const notifications = await this.notificationModel
        .find(query)
        .sort({ created_at: -1 })
        .limit(data.limit || 10)
        .skip(data.offset || 0)
        .exec();

      const total = await this.notificationModel.countDocuments(query);

      return { success: true, notifications, total } as any;
    } catch (error) {
      this.logger.error(`GetNotifications error: ${error.message}`);
      throw new BadRequestException('Failed to fetch notifications');
    }
  }

  async markNotificationAsRead(data: MarkNotificationAsReadDto): Promise<MarkNotificationAsReadResponseDto> {
    try {
      const notification = await this.notificationModel.findOneAndUpdate(
        { _id: data.notification_id, user_id: data.user_id },
        { $set: { is_read: true } },
        { new: true }
      );

      if (!notification) {
        throw new NotFoundException('Notification not found');
      }

      return { success: true, message: 'Marked as read' };
    } catch (error) {
      this.logger.error(`MarkNotificationAsRead error: ${error.message}`);
      throw new BadRequestException('Failed to mark notification as read');
    }
  }

  async getProfile(data: GetProfileDto): Promise<GetProfileResponseDto> {
    try {
      // Fetch user from UserService
      const user = await firstValueFrom(this.userService.GetUserById({ id: data.user_id })) as any;
      if (!user.data) {
        throw new NotFoundException('User not found');
      }

      // Fetch post count, followers, following
      const postCount = await this.postModel.countDocuments({ user_id: data.user_id });
      const followerCount = await this.followModel.countDocuments({ followee_id: data.user_id });
      const followingCount = await this.followModel.countDocuments({ follower_id: data.user_id });

      // Fetch recent posts
      const posts = await this.postModel
        .find({ user_id: data.user_id })
        .sort({ created_at: -1 })
        .limit(12)
        .populate('user_id', 'name')
        .exec();

      const profile = {
        id: data.user_id,
        user_id: data.user_id,
        bio: user.data.bio || '', // Assuming user has bio
        profile_image: user.data.profile_image,
        post_count: postCount,
        follower_count: followerCount,
        following_count: followingCount,
        posts,
      };

      return { success: true, profile } as any;
    } catch (error) {
      this.logger.error(`GetProfile error: ${error.message}`);
      throw new BadRequestException('Failed to fetch profile');
    }
  }

  async updateProfile(data: UpdateProfileDto): Promise<UpdateProfileResponseDto> {
    try {
      // Update in UserService
      const updatedUser = await firstValueFrom(this.userService.UpdateProfile({
        user_id: data.user_id,
        bio: data.bio,
        profile_image: data.profile_image,
      }));

      if (!updatedUser) {
        throw new BadRequestException('Failed to update profile');
      }

      return { success: true, message: 'Profile updated', profile: updatedUser } as any; // Adjust based on response
    } catch (error) {
      this.logger.error(`UpdateProfile error: ${error.message}`);
      throw new BadRequestException('Failed to update profile');
    }
  }

  async searchPosts(data: SearchPostsDto): Promise<SearchPostsResponseDto> {
    try {
      const query = {
        $or: [
          { caption: { $regex: data.query, $options: 'i' } },
          { tags: { $in: [new RegExp(data.query, 'i')] } },
        ],
      };

      const posts = await this.postModel
        .find(query)
        .sort({ created_at: -1 })
        .limit(data.limit || 10)
        .skip(data.offset || 0)
        .populate('user_id', 'name')
        .exec();

      const total = await this.postModel.countDocuments(query);

      return { success: true, posts, total } as any;
    } catch (error) {
      this.logger.error(`SearchPosts error: ${error.message}`);
      throw new BadRequestException('Failed to search posts');
    }
  }

  async searchUsers(data: SearchUsersDto): Promise<SearchUsersResponseDto> {
    try {
      // Search via UserService
      const users = await firstValueFrom(this.userService.SearchUsers({ query: data.query, limit: data.limit, offset: data.offset })) as any;
      // Assuming UserService has SearchUsers RPC

      const userSummaries = users.users?.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username || '',
        profile_image: u.profile_image,
        is_following: false, // Check via follow model if needed
      })) || [];

      return { success: true, users: userSummaries, total: users.total || 0 };
    } catch (error) {
      this.logger.error(`SearchUsers error: ${error.message}`);
      throw new BadRequestException('Failed to search users');
    }
  }
}