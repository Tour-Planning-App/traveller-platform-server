import { Module } from '@nestjs/common';
import { ToolsServiceController } from './tools-service.controller';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GrpcExceptionFilter } from '../../filters/grpc-exception.filter';
import { join } from 'path';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
      JwtModule.register({
        secret: process.env.JWT_SECRET || 'secret',
        global: true,
      }),
      ClientsModule.register([
        {
          name: 'TOOLS_PACKAGE',
          transport: Transport.GRPC,
          options: {
            package: 'tools',
            protoPath: join(__dirname, 'proto/tool.proto'),
            url: 'localhost:50057', // Assume port for itineraries service
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
  controllers: [ToolsServiceController],
    providers: [
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
export class ToolsServiceModule {}
