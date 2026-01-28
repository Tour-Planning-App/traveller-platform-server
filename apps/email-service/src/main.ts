/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { Logger } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: 'email-service',
        brokers: [process.env.KAFKA_BROKER || 'localhost:29092'],
        retry: {
          initialRetryTime: 1000,
          retries: 10,
        },
        connectionTimeout: 10000,
      },
      consumer: {
        groupId: 'email-consumer-group',
        retry: {
          initialRetryTime: 1000,
          retries: 10,
        },
      },
    },
  });

  await app.listen();
  Logger.log(`🚀 Email microservice is listening on Kafka broker`);
}

bootstrap();
