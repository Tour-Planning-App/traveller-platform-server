import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
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
        name: 'NOTIFICATION_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'notification',
          protoPath: join(__dirname, 'proto/notification.proto'),
          url: process.env.NOTIFICATION_GRPC_URL || 'localhost:50051',
        },
      },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_FILTER,
      useClass: GrpcExceptionFilter,
    },
  ],
})
export class NotificationModule { }
