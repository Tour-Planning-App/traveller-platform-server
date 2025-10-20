import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Post, PostSchema } from './schemas/post.schema';
import { Notification, NotificationSchema } from './schemas/notification.schema';
import { Follow, FollowSchema } from './schemas/follow.schema';
import { join } from 'path';
import { MediaService } from './media.service'; // New import
import { MulterModule } from '@nestjs/platform-express'; // For file uploads
import { Comment, CommentSchema } from './schemas/comment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Post.name, schema: PostSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: Follow.name, schema: FollowSchema },
      { name: Comment.name, schema: CommentSchema }, // New Comment schema
    ]),
    ClientsModule.register([
      {
        name: 'USER_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'user',
          protoPath: join(__dirname, 'proto/user.proto'),
          url: 'localhost:50053', // Matches recommendation service port
        },
      },
      {
        name: 'KAFKA_PRODUCER',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'community-producer',
            brokers: [process.env.KAFKA_BROKERS || 'localhost:9092'],
          },
          consumer: {
            groupId: 'community-consumer',
          },
        },
      },
    ]),
    MulterModule.register({
      dest: '/tmp/uploads', // Temporary storage; adjust as needed
    }),
  ],
  providers: [CommunityService, MediaService], // Add MediaService
  controllers: [CommunityController],
})
export class CommunityModule {}
