import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EmailModule } from './email/email.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [EmailModule,
    ConfigModule.forRoot(),
    ClientsModule.register([
      {
        name: 'EMAIL_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'email-service',
            brokers: [process.env.KAFKA_BROKER || 'localhost:29092'],
          },
          consumer: {
            groupId: 'email-consumer-group',
          },
        },
      },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
