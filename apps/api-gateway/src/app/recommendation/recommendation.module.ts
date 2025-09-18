import { Module } from '@nestjs/common';
import { RecommendationController } from './recommendation.controller';
import { RecommendationService } from './recommendation.service';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../app/auth/guards/jwt-auth.guard';
import { join } from 'path';
import { GrpcExceptionFilter } from '../../filters/grpc-exception.filter';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      global: true,
    }),
    ClientsModule.register([
      {
        name: 'RECOMMENDATION_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'recommendation',
          protoPath: join(__dirname, 'proto/recommendation.proto'),
          url: 'localhost:50052', // Matches recommendation service port
        },
      },
    ]),
  ],
  controllers: [RecommendationController],
  providers: [RecommendationService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide:APP_FILTER,
      useClass:GrpcExceptionFilter
    }
  ],
})
export class RecommendationModule {}
