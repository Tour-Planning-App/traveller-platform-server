import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';

import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
// import { GoogleStrategy } from './strategies/google.strategy';
// import { FacebookStrategy } from './strategies/facebook.strategy';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '7d' },
    }),
    ClientsModule.register([
      {
        name: 'EMAIL_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'auth-service',
            brokers: [process.env.KAFKA_BROKER || 'localhost:29092'],
            retry: {
              initialRetryTime: 1000,
              retries: 10,
            },
            connectionTimeout: 10000,
          },
          consumer: {
            groupId: 'auth-consumer-group',
          },
          producer: {
            retry: {
              initialRetryTime: 1000,
              retries: 10,
            },
          },
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
