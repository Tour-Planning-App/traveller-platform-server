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
      package: 'tips',
      protoPath: join(__dirname, 'proto/tips.proto'),
      url: 'localhost:50056', // Different port for user service
    },
  });
  await app.listen();

  Logger.log(`🚀 Tips microservice is listening on gRPC channel`);
}

bootstrap();
