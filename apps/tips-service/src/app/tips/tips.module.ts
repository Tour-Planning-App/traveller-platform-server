import { Module } from '@nestjs/common';
import { TipsService } from './tips.service';
import { TipsController } from './tips.controller';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Tip, TipSchema } from './schemas/tip.schema';
import { Category, CategorySchema } from './schemas/category.schema';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forFeature(
      [{ name: Tip.name, schema: TipSchema },
        { name: Category.name, schema: CategorySchema }
      ],
    ),
       ClientsModule.register([
          {
            name: 'USER_PACKAGE',
            transport: Transport.GRPC,
            options: {
              package: 'user',
              protoPath: join(__dirname, 'proto/user.proto'),
              url: 'localhost:50053', // Matches recommendation service port
            },
          },
        ]),

  ],
  providers: [TipsService],
  controllers: [TipsController],
})
export class TipsModule {}