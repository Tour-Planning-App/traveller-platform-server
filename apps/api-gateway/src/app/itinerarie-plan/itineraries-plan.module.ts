import { Module } from '@nestjs/common';
import { ItinerariesPlanController } from './itineraries-plan.controller';
import { ItinerariesPlanService } from './itineraries-plan.service';
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
        name: 'ITINERARIES_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'itineraries',
          protoPath: join(__dirname, 'proto/itineraries.proto'),
          url: process.env.ITINERARIES_GRPC_URL || 'localhost:50054',
        },
      },
      {
        name: 'AUTH_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(__dirname, 'proto/auth.proto'), // Adjust if auth is in sibling dir (e.g., ../../ for Nx)
          url: process.env.AUTH_GRPC_URL || 'localhost:50000',
        },
      },
    ]),
  ],
  controllers: [ItinerariesPlanController],
  providers: [ItinerariesPlanService,
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
export class ItinerariesPlanModule { }