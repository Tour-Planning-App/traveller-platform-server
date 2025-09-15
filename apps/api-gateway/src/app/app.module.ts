import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [AuthModule,
    ClientsModule.register([
      {
        name: 'AUTH_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'auth',
          protoPath: join(__dirname, 'proto/auth.proto'),
          // url: 'auth-service:50051',
        },
      },
      // {
      //   name: 'TRIP_PACKAGE',
      //   transport: Transport.GRPC,
      //   options: {
      //     package: 'trip',
      //     protoPath: join(__dirname, 'proto/trip.proto'),
      //     url: 'trip-service:50052',
      //   },
      // },
      // {
      //   name: 'KAFKA_SERVICE',
      //   transport: Transport.KAFKA,
      //   options: {
      //     client: { brokers: ['kafka:9092'] },
      //   },
      // },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
