import { Module } from '@nestjs/common';
import { PersonalizedRecommendationService } from './personalized-recommendation.service';
import { PersonalizedRecommendationController } from './personalized-recommendation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Recommendation, RecommendationSchema } from './schemas/recommendation.schema';
import { ConfigModule } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { join } from 'path';

@Module({
  imports: [PersonalizedRecommendationModule,
      ConfigModule.forRoot({ isGlobal: true }),  
      MongooseModule.forFeature(
        [{ name: Recommendation.name, schema: RecommendationSchema }],
      ),
      ClientsModule.register([
      {
        name: 'USER_PACKAGE',
        transport: Transport.GRPC,
        options: {
          package: 'user',
          protoPath: join(__dirname,'proto/user.proto'),
          url: 'localhost:50053', // User service port 
        },
      },
    ]),
    ],
  providers: [PersonalizedRecommendationService],
  controllers: [PersonalizedRecommendationController],
})
export class PersonalizedRecommendationModule {}
