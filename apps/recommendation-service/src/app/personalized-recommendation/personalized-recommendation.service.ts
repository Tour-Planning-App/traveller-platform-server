import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recommendation } from './schemas/recommendation.schema';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom } from 'rxjs';

@Injectable()
export class PersonalizedRecommendationService {
    private readonly logger = new Logger(PersonalizedRecommendationService.name);
    private readonly llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.7,
    });

    // constructor(
    //     @InjectModel(Recommendation.name)
    //     private readonly recommendationModel: Model<Recommendation>,
    // ) {}

    private userService: any;

    constructor(
        @InjectModel(Recommendation.name)
        private readonly recommendationModel: Model<Recommendation>,
        @Inject('USER_PACKAGE') private userClient: ClientGrpcProxy,
    ) {
        this.userService = this.userClient.getService('UserService');
    }

  async generateRecommendations(dto: any): Promise<any> {
    try {
      const { userId, travelerTypes, transportationPreferences, foodDrinkPreferences, sriLankaVibes } = dto;

      // Fetch user details from User Service via gRPC
      const userResponse = await firstValueFrom(
        this.userService.GetUserById({ id: userId }).pipe(
          catchError((error) => {
            this.logger.error(`Failed to fetch user: ${error.message}`, error.stack);
            throw new Error('User not found');
          })
        )
      ) as any;
      if (userResponse.status !== 200) {
        throw new Error('Failed to fetch user details');
      }
      const user = userResponse.data;

      // Build prompt with user data
      const promptTemplate = PromptTemplate.fromTemplate(`
        You are a travel expert for Sri Lanka. Generate 3 personalized recommendations for each category: locations, restaurants, hidden gems.
        Based on user details:
        - Name: {name}
        - Role: {role}
        - Preferences: {preferredLanguage}, {preferredCurrency}
        - Traveler types: {travelerTypes}
        - Transportation: {transportationPreferences}
        - Food/Drink: {foodDrinkPreferences}
        - Vibes: {sriLankaVibes}

        For each recommendation, include:
        - Name
        - Short description
        - Why it fits the user
        - Location

        Output as JSON:
        {{
        "locations": [{{"name": "", "description": "", "why": "", "location": ""}}],
        "restaurants": [{{"name": "", "description": "", "why": "", "location": ""}}],
        "hiddenGems": [{{"name": "", "description": "", "why": "", "location": ""}}]
        }}
      `);

      const chain = promptTemplate.pipe(this.llm).pipe(new StringOutputParser());
      const response = await chain.invoke({
        name: user.name,
        role: user.role,
        preferredLanguage: user.preferredLanguage || 'English',
        preferredCurrency: user.preferredCurrency || 'USD',
        travelerTypes: travelerTypes?.join(', ') || 'general',
        transportationPreferences: transportationPreferences?.join(', ') || 'general',
        foodDrinkPreferences: foodDrinkPreferences?.join(', ') || 'general',
        sriLankaVibes: sriLankaVibes?.join(', ') || 'general',
      });

      const parsed = JSON.parse(response);
      const recommendations = [
        { category: 'locations', recommendations: parsed.locations, description: '', details: parsed.locations },
        { category: 'restaurants', recommendations: parsed.restaurants, description: '', details: parsed.restaurants },
        { category: 'hidden-gems', recommendations: parsed.hiddenGems, description: '', details: parsed.hiddenGems },
      ];

      for (const rec of recommendations) {
        const recommendation = new this.recommendationModel({
          userId,
          category: rec.category,
          recommendations: rec.recommendations.map((r: any) => r.name),
          description: rec.description || '',
          details: rec.details || {},
        });
        await recommendation.save();
      }

      return {
        status: 200,
        message: 'Recommendations generated successfully',
        data: recommendations,
      };
    } catch (error) {
      this.logger.error(`GenerateRecommendations error: ${error.message}`, error.stack);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }
}
