import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PersonalizedRecommendationService } from './personalized-recommendation.service';

@Controller('personalized-recommendation')
export class PersonalizedRecommendationController {
    private readonly logger = new Logger(PersonalizedRecommendationController.name);

  constructor(private readonly personalizedRecommendationService: PersonalizedRecommendationService) {}

    @GrpcMethod('RecommendationService', 'GenerateRecommendations')
    async generateRecommendations(data: any) {
        this.logger.log(`Generating recommendations for user: ${data.userId}`);
        return await this.personalizedRecommendationService.generateRecommendations(data);
    }

}
