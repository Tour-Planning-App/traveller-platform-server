import { Module } from '@nestjs/common';
import { PersonalizedRecommendationService } from './personalized-recommendation.service';
import { PersonalizedRecommendationController } from './personalized-recommendation.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Recommendation, RecommendationSchema } from './schemas/recommendation.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PersonalizedRecommendationModule,
      ConfigModule.forRoot({ isGlobal: true }),  
      MongooseModule.forFeature(
        [{ name: Recommendation.name, schema: RecommendationSchema }],
      ),
    ],
  providers: [PersonalizedRecommendationService],
  controllers: [PersonalizedRecommendationController],
})
export class PersonalizedRecommendationModule {}
