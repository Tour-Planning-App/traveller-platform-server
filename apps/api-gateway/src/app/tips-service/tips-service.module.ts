import { Module } from '@nestjs/common';
import { TipsServiceController } from './tips-service.controller';
import { TipsServiceService } from './tips-service.service';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
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
            name: 'TIPS_PACKAGE',
            transport: Transport.GRPC,
            options: {
              package: 'tips',
              protoPath: join(__dirname, 'proto/tips.proto'),
              url: 'localhost:50056', // Assume port for itineraries service
            },
          },
          {
            name: 'AUTH_PACKAGE',
            transport: Transport.GRPC,
            options: {
              package: 'auth',
              protoPath: join(__dirname, 'proto/auth.proto'), // Adjust if auth is in sibling dir (e.g., ../../ for Nx)
              url: 'localhost:50000', // Auth service port
            },
          },
        ]),
      ],
  controllers: [TipsServiceController],
  providers: [TipsServiceService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GrpcExceptionFilter,
    },
    SubscriptionGuard, // Optional global; use per-route
  ],
})
export class TipsServiceModule {}
