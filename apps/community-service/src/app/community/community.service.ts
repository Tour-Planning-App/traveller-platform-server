// community.service.ts (complete with all methods)
import { Inject, Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Post } from './schemas/post.schema';
import { Comment } from './schemas/comment.schema';
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
  GetPostLikersDto,
  GetPostLikersResponseDto,
  GetPostCommentsDto,
  GetPostCommentsResponseDto,
  // Import all other DTOs
} from './dtos/post.dto'; // Assuming all in one file or import accordingly
import { Types } from 'mongoose'; // Ensure this is imported at the top
@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);
  private userService: any;

  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @InjectModel(Notification.name) private notificationModel: Model<Notification>,
    @InjectModel(Follow.name) private followModel: Model<Follow>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @Inject('USER_PACKAGE') private userClient: ClientGrpcProxy,
  ) {
    this.userService = this.userClient.getService('UserService');
  }

  async createPost(data: CreatePostDto): Promise<CreatePostResponseDto> {
    try {
      // Verify user exists via UserService gRPC
      const user = await firstValueFrom(this.userService.GetUserById({ id: data.userId })) as any;
      if (!user.data) {
        throw new NotFoundException('User not found');
      }

      const post = new this.postModel({
        ...data,
        userId: data.userId,
        likeCount: 0,
        likes: [],
        comments: [],
      });
      await post.save();

      // Emit Kafka event for post creation (e.g., notify followers)
      // Assuming Kafka client is injected or handled elsewhere
      // this.kafkaClient.emit('post.created', { postId: post.id, userId: data.userId });

      return { success: true, message: 'Post created', post: post.toObject() } as any;
    } catch (error) {
      this.logger.error(`CreatePost error: ${error.message}`);
      throw new BadRequestException(error.message);
    }
  }

  async getPosts(data: GetPostsDto): Promise<GetPostsResponseDto> {
    try {
      let query: any = {};
      if (data.userId) query.userId = data.userId;
      if (data.feedType === 'following') {
        // Fetch following users via follow model and aggregate
        const following = await this.followModel.find({ followerId: data.userId }).select('followeeId');
        const followeeIds = following.map(f => f.followeeId);
        if (followeeIds.length === 0) {
          return { success: true, posts: [], total: 0 };
        }
        query.userId = { $in: followeeIds };
      }
      // For popular, sort by likeCount descending, then createdAt
      const sortQuery = data.feedType === 'popular' 
        ? { likeCount: -1, createdAt: -1 } 
        : { createdAt: -1 } as any;

      const posts = await this.postModel
        .find(query)
        .sort(sortQuery)
        .limit(data.limit || 10)
        .skip(data.offset || 0)
        .populate('userId', 'name profileImage') // Assuming ref to user in schema
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
        .findById(data.postId)
        .populate('userId', 'name profileImage')
        .populate({
          path: 'comments',
          populate: { path: 'userId', select: 'name profileImage' }
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
        { _id: data.postId, userId: data.userId },
        { $set: { caption: data.caption, imageUrl: data.imageUrl } },
        { new: true }
      ).populate('userId', 'name profileImage').exec();

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
      const post = await this.postModel.findOneAndDelete({ _id: data.postId, userId: data.userId });
      if (!post) {
        throw new NotFoundException('Post not found or unauthorized');
      }

      // Emit Kafka event for post deletion
      // this.kafkaClient.emit('post.deleted', { postId: data.postId });

      return { success: true, message: 'Post deleted' };
    } catch (error) {
      this.logger.error(`DeletePost error: ${error.message}`);
      throw new BadRequestException('Failed to delete post');
    }
  }

  async likePost(data: LikePostDto): Promise<LikePostResponseDto> {
    try {
      const post = await this.postModel.findById(data.postId) as any;
      if (!post) {
        throw new NotFoundException('Post not found');
      }
      console.log('LikePost data:', data);
      const existingLikeIndex = post.likes.findIndex(l => l.userId === data.userId);
      if (data.like) {
        console.log('Liking the post');
        if (existingLikeIndex === -1) {
          post.likes.push(new Types.ObjectId(data.userId));
          post.likeCount += 1;
        }
      } else {
        console.log('Unliking the post');
        if (existingLikeIndex !== -1) {
          post.likes.splice(existingLikeIndex, 1);
          post.likeCount -= 1;
        }
      }
      console.log('Updated likes:', post.likes);
      await post.save();

      // Emit Kafka event for like notification
      // this.kafkaClient.emit('post.liked', { postId: data.postId, userId: data.userId, action: data.like ? 'liked' : 'unliked' });

      return { success: true, message: 'Like updated', likeCount: post.likeCount };
    } catch (error) {
      this.logger.error(`LikePost error: ${error.message}`);
      throw new BadRequestException('Failed to update like');
    }
  }

  // async commentPost(data: CommentPostDto): Promise<CommentPostResponseDto> {
  //   try {
  //     const post = await this.postModel.findById(data.postId);
  //     if (!post) {
  //       throw new NotFoundException('Post not found');
  //     }

  //     // Assuming a separate Comment model; for simplicity, add to post.comments array
  //     const newComment = {
  //       id: new Date().getTime().toString(), // Simple ID
  //       userId: data.userId,
  //       text: data.comment,
  //       createdAt: new Date().toISOString(),
  //     } as any;
  //     post.comments.push(newComment);
  //     await post.save();

  //     // Emit Kafka event for comment notification
  //     // this.kafkaClient.emit('post.commented', { postId: data.postId, userId: data.userId, commentId: newComment.id });

  //     return { success: true, message: 'Comment added', comment: newComment };
  //   } catch (error) {
  //     this.logger.error(`CommentPost error: ${error.message}`);
  //     throw new BadRequestException('Failed to add comment');
  //   }
  // }

  async commentPost(data: CommentPostDto): Promise<CommentPostResponseDto> {
    try {
      const post = await this.postModel.findById(data.postId);
      if (!post) {
        throw new NotFoundException('Post not found');
      }

      // Create new Comment document
      const newComment = new this.commentModel({
        postId: new Types.ObjectId(data.postId),
        userId: new Types.ObjectId(data.userId),
        text: data.comment,
        createdAt: new Date(),
      }) as any;
      await newComment.save();

      // Add ref to post
      post.comments.push(newComment._id);
      await post.save();

      // Populate for response
      await newComment.populate('userId', 'name profileImage username');

      const commentData = {
        id: newComment._id.toString(),
        postId: data.postId,
        userId: data.userId,
        text: data.comment,
        createdAt: newComment.createdAt,
      };

      // Emit Kafka event...
      // this.kafkaClient.emit('post.commented', { postId: data.postId, userId: data.userId, commentId: newComment._id });

      return { success: true, message: 'Comment added', comment: commentData };
    } catch (error) {
      this.logger.error(`CommentPost error: ${error.message}`);
      throw new BadRequestException('Failed to add comment');
    }
  }

  // New method: Get likers with details
  // async getPostLikers(data: GetPostLikersDto): Promise<GetPostLikersResponseDto> {
  //   try {
  //     const post = await this.postModel.findById(data.postId).populate({
  //       path: 'likes',
  //       select: 'name profileImage username',
  //       model: 'User',  // Assuming User model
  //     }).exec();

  //     if (!post) {
  //       throw new NotFoundException('Post not found');
  //     }

  //     let likers = post.likes as any[];  // Populated users
  //     const total = likers.length;

  //     // Paginate
  //     if (data.limit) {
  //       likers = likers.slice(data.offset || 0, (data.offset || 0) + (data.limit || 10));
  //     }

  //     // Compute isFollowing for current user
  //     const likerSummaries = await Promise.all(likers.map(async (liker: any) => {
  //       let isFollowing = false;
  //       if (data.currentUserId) {
  //         const follow = await this.followModel.findOne({
  //           followerId: new Types.ObjectId(data.currentUserId),
  //           followeeId: liker._id,
  //         });
  //         isFollowing = !!follow;
  //       }
  //       return {
  //         id: liker._id.toString(),
  //         name: liker.name,
  //         username: liker.username || '',
  //         profileImage: liker.profileImage,
  //         isFollowing,
  //       };
  //     }));

  //     return { success: true, likers: likerSummaries, total };
  //   } catch (error) {
  //     this.logger.error(`GetPostLikers error: ${error.message}`);
  //     throw new BadRequestException('Failed to fetch likers');
  //   }
  // }
  async getPostLikers(data: GetPostLikersDto): Promise<GetPostLikersResponseDto> {
  try {
    const post = await this.postModel.findById(data.postId);
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const likeIds = post.likes;  // Array of ObjectId (no populate)
    const total = likeIds.length;

    // Paginate IDs first (efficient)
    const paginatedIds = likeIds.slice(data.offset || 0, (data.offset || 0) + (data.limit || 10));

    // Fetch user details via gRPC for each
    const likerPromises = paginatedIds.map(async (likeId: Types.ObjectId) => {
      try {
        const userResponse = await firstValueFrom(
          this.userService.GetUserById({ id: likeId.toString() })
        ) as any;
        const user = userResponse.data || userResponse.user;  // Adjust based on UserService response

        let isFollowing = false;
        if (data.currentUserId && user) {
          const follow = await this.followModel.findOne({
            followerId: new Types.ObjectId(data.currentUserId),
            followeeId: new Types.ObjectId(user.id),
          });
          isFollowing = !!follow;
        }

        return {
          id: user?.id || likeId.toString(),
          name: user?.name || 'Unknown User',
          username: user?.username || '',
          profileImage: user?.profileImage || '',
          isFollowing,
        };
      } catch (fetchError) {
        this.logger.warn(`Failed to fetch user ${likeId}: ${fetchError.message}`);
        return {
          id: likeId.toString(),
          name: 'Unknown User',
          username: '',
          profileImage: '',
          isFollowing: false,
        };
      }
    });

    const likerSummaries = await Promise.all(likerPromises);

    return { success: true, likers: likerSummaries, total };
  } catch (error: any) {
    this.logger.error(`GetPostLikers error: ${error.message}`);
    throw new BadRequestException('Failed to fetch likers');
  }
}

  // New method: Get comments with details
async getPostComments(data: GetPostCommentsDto): Promise<GetPostCommentsResponseDto> {
  try {
    const comments = await this.commentModel
      .find({ postId: new Types.ObjectId(data.postId) })
      .sort({ createdAt: -1 })
      .limit(data.limit || 10)
      .skip(data.offset || 0)
      .exec() as any;  // No populate

    const total = await this.commentModel.countDocuments({ postId: new Types.ObjectId(data.postId) });

    const detailedComments = await Promise.all(comments.map(async (comment) => {
      // Fetch user via gRPC
      const userResponse = await firstValueFrom(
        this.userService.GetUserById({ id: comment.userId.toString() })
      ) as any;
      const user = userResponse.data || userResponse.user;

      let isFollowing = false;
      if (data.currentUserId && user) {
        const follow = await this.followModel.findOne({
          followerId: new Types.ObjectId(data.currentUserId),
          followeeId: new Types.ObjectId(user.id),
        });
        isFollowing = !!follow;
      }

      return {
        comment: {
          id: comment._id.toString(),
          postId: data.postId,
          userId: comment.userId.toString(),
          text: comment.text,
          createdAt: comment.createdAt,  // Keep as Date object for gRPC Timestamp serialization
        },
        user: {
          id: user?.id || comment.userId.toString(),
          name: user?.name || 'Unknown User',
          username: user?.username || '',
          profileImage: user?.profileImage || '',
        },
        isFollowing,
      };
    }));

    return { success: true, comments: detailedComments, total } as any;
  } catch (error: any) {
    this.logger.error(`GetPostComments error: ${error.message}`);
    throw new BadRequestException('Failed to fetch comments');
  }
}

  async followUser(data: FollowUserDto): Promise<FollowUserResponseDto> {
    try {
      let follow = await this.followModel.findOne({ followerId: data.followerId, followeeId: data.followeeId });
      if (follow) {
        return { success: false, message: 'Already following', isFollowing: true };
      }

      follow = new this.followModel({
        followerId: data.followerId,
        followeeId: data.followeeId,
      });
      await follow.save();

      // Emit Kafka event for follow notification
      // this.kafkaClient.emit('user.followed', { followerId: data.followerId, followeeId: data.followeeId });

      return { success: true, message: 'Followed', isFollowing: true };
    } catch (error) {
      this.logger.error(`FollowUser error: ${error.message}`);
      throw new BadRequestException('Failed to follow user');
    }
  }

  async unfollowUser(data: UnfollowUserDto): Promise<FollowUserResponseDto> {
    try {
      const follow = await this.followModel.findOneAndDelete({
        followerId: data.followerId,
        followeeId: data.followeeId,
      });
      if (!follow) {
        return { success: false, message: 'Not following', isFollowing: false };
      }

      // Emit Kafka event for unfollow
      // this.kafkaClient.emit('user.unfollowed', { followerId: data.followerId, followeeId: data.followeeId });

      return { success: true, message: 'Unfollowed', isFollowing: false };
    } catch (error) {
      this.logger.error(`UnfollowUser error: ${error.message}`);
      throw new BadRequestException('Failed to unfollow user');
    }
  }

  async getFollowers(data: GetFollowersDto): Promise<GetFollowersResponseDto> {
    try {
      const followers = await this.followModel
        .find({ followeeId: data.userId })
        .populate('followerId', 'name profileImage username')
        .limit(data.limit || 10)
        .skip(data.offset || 0)
        .exec() as any;

      const total = await this.followModel.countDocuments({ followeeId: data.userId });

      const followerSummaries = followers.map(f => ({
        id: f.followerId._id,
        name: f.followerId.name,
        username: f.followerId.username,
        profileImage: f.followerId.profileImage,
        isFollowing: true, // Since they follow you
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
        .find({ followerId: data.userId })
        .populate('followeeId', 'name profileImage username')
        .limit(data.limit || 10)
        .skip(data.offset || 0)
        .exec() as any;

      const total = await this.followModel.countDocuments({ followerId: data.userId });

      const followingSummaries = following.map(f => ({
        id: f.followeeId._id,
        name: f.followeeId.name,
        username: f.followeeId.username,
        profileImage: f.followeeId.profileImage,
        isFollowing: true,
      }));

      return { success: true, following: followingSummaries, total };
    } catch (error) {
      this.logger.error(`GetFollowing error: ${error.message}`);
      throw new BadRequestException('Failed to fetch following');
    }
  }

  async getNotifications(data: GetNotificationsDto): Promise<GetNotificationsResponseDto> {
    try {
      let query: any = { userId: data.userId };
      if (data.type) query.type = data.type;

      const notifications = await this.notificationModel
        .find(query)
        .sort({ createdAt: -1 })
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
        { _id: data.notificationId, userId: data.userId },
        { $set: { isRead: true } },
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
      const user = await firstValueFrom(this.userService.GetUserById({ id: data.userId })) as any;
      if (!user.data) {
        throw new NotFoundException('User not found');
      }

      // Fetch post count, followers, following
      const postCount = await this.postModel.countDocuments({ userId: data.userId });
      const followerCount = await this.followModel.countDocuments({ followeeId: data.userId });
      const followingCount = await this.followModel.countDocuments({ followerId: data.userId });

      // Fetch recent posts
      const posts = await this.postModel
        .find({ userId: data.userId })
        .sort({ createdAt: -1 })
        .limit(12)
        .populate('userId', 'name')
        .exec();

      const profile = {
        id: data.userId,
        userId: data.userId,
        bio: user.data.bio || '', // Assuming user has bio
        profileImage: user.data.profileImage,
        postCount: postCount,
        followerCount: followerCount,
        followingCount: followingCount,
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
        userId: data.userId,
        bio: data.bio,
        profileImage: data.profileImage,
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
        .sort({ createdAt: -1 })
        .limit(data.limit || 10)
        .skip(data.offset || 0)
        .populate('userId', 'name')
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
        profileImage: u.profileImage,
        isFollowing: false, // Check via follow model if needed
      })) || [];

      return { success: true, users: userSummaries, total: users.total || 0 };
    } catch (error) {
      this.logger.error(`SearchUsers error: ${error.message}`);
      throw new BadRequestException('Failed to search users');
    }
  }
}