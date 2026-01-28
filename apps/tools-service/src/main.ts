/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */


import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.GRPC,
    options: {
      package: 'tools',
      protoPath: join(__dirname, 'proto/tool.proto'),
      url: process.env.GRPC_URL || 'localhost:50057',
    },
  });
  await app.listen();
  Logger.log(`🚀 Tools microservice is listening on gRPC channel`);
}

bootstrap();