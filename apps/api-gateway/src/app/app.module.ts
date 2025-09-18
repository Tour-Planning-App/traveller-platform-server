import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { NotificationModule } from './notification/notification.module';
import {} from '@nestjs/common';
import { RecommendationModule } from './recommendation/recommendation.module';

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
          url: '0.0.0.0:50000',
        },
      },
      {
        name: 'NOTIFICATION_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'notification',
          protoPath: join(__dirname, 'proto/notification.proto'),
          url: '0.0.0.0:50051',
        },
      },
      {
        name: 'RECOMMENDATION_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'recommendation',
          protoPath: join(__dirname, 'proto/recommendation.proto'),
          url: '0.0.0.0:50052', // Matches recommendation service port
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
    NotificationModule,
    RecommendationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
