import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GrpcExceptionFilter } from '../../filters/grpc-exception.filter';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
      JwtModule.register({
        secret: process.env.JWT_SECRET || 'secret',
        global: true,
      }),
      ClientsModule.register([
        {
          name: 'USER_PACKAGE',
          transport: Transport.GRPC,
          options: {
            package: 'user',
            protoPath: join(__dirname, 'proto/user.proto'),
            url: 'localhost:50052', // Matches recommendation service port
          },
        },
      ]),
    ],
  controllers: [UserController],
  providers: [UserService,
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
export class UserModule {}
