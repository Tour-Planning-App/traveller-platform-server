import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Recommendation } from './schemas/recommendation.schema';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

@Injectable()
export class PersonalizedRecommendationService {
    private readonly logger = new Logger(PersonalizedRecommendationService.name);
    private readonly llm = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: 'gpt-4o-mini',
        temperature: 0.7,
    });

    constructor(
        @InjectModel(Recommendation.name)
        private readonly recommendationModel: Model<Recommendation>,
    ) {}


    async generateRecommendations({
        userId,
        travelerTypes,
        transportationPreferences,
        foodDrinkPreferences,
        sriLankaVibes,
    }: any): Promise<any> {
    try {
      const promptTemplate = PromptTemplate.fromTemplate(`
        You are a travel expert for Sri Lanka. Generate 3 personalized recommendations for each category: locations, restaurants, hidden gems.
        Based on user preferences:
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
