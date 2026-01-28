import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NotificationModule } from './notification/notification.module';
import { } from '@nestjs/common';
import { RecommendationModule } from './recommendation/recommendation.module';
import { UserModule } from './user/user.module';
import { ItinerariesPlanModule } from './itinerarie-plan/itineraries-plan.module';
import { CommunityServiceModule } from './community-service/community-service.module';
import { TipsServiceModule } from './tips-service/tips-service.module';
import { ToolsServiceService } from './tools-service/tools-service.service';
import { ToolsServiceModule } from './tools-service/tools-service.module';
import { LogsServiceModule } from './logs-service/logs-service.module';
import { LogsModule } from './logs/logs.module';

@Module({
  imports: [
    AuthModule,
    ClientsModule.register([
      {
        name: 'AUTH_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(__dirname, 'proto/auth.proto'),
          url: process.env.AUTH_GRPC_URL || 'localhost:50000',
        },
      },
      {
        name: 'NOTIFICATION_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'notification',
          protoPath: join(__dirname, 'proto/notification.proto'),
          url: process.env.NOTIFICATION_GRPC_URL || 'localhost:50051',
        },
      },
      {
        name: 'RECOMMENDATION_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'recommendation',
          protoPath: join(__dirname, 'proto/recommendation.proto'),
          url: process.env.RECOMMENDATION_GRPC_URL || 'localhost:50052',
        },
      },
      {
        name: 'USER_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'user',
          protoPath: join(__dirname, 'proto/user.proto'),
          url: process.env.USER_GRPC_URL || 'localhost:50053',
        },
      },
      {
        name: 'ITINERARIES_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'itineraries',
          protoPath: join(__dirname, 'proto/itineraries.proto'),
          url: process.env.ITINERARIES_GRPC_URL || 'localhost:50054',
        },
      },
      {
        name: 'COMMUNITY_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'community',
          protoPath: join(__dirname, 'proto/community.proto'),
          url: process.env.COMMUNITY_GRPC_URL || 'localhost:50055',
        },
      },
      {
        name: 'TIPS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'tips',
          protoPath: join(__dirname, 'proto/tips.proto'),
          url: process.env.TIPS_GRPC_URL || 'localhost:50056',
        },
      },
      {
        name: 'TOOLS_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'tools',
          protoPath: join(__dirname, 'proto/tool.proto'),
          url: process.env.TOOLS_GRPC_URL || 'localhost:50057',
        },
      },
      // {
      //   name: 'TRIP_PACKAGE',
      //   transport: Transport.GRPC,
      //   options: {
      //     package: 'trip',
      //     protoPath: join(__dirname, 'proto/trip.proto'),
      //     url: 'trip-service:50052',
      //   },
      // },
      // {
      //   name: 'KAFKA_SERVICE',
      //   transport: Transport.KAFKA,
      //   options: {
      //     client: { brokers: ['kafka:9092'] },
      //   },
      // },
    ]),
    UserModule,
    RecommendationModule,
    NotificationModule,
    ItinerariesPlanModule,
    CommunityServiceModule,
    TipsServiceModule,
    ToolsServiceModule,
    LogsServiceModule,
    LogsModule,
  ],
  controllers: [AppController],
  providers: [AppService, ToolsServiceService],
})
export class AppModule { }
