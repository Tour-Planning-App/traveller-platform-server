// tools.service.ts - Service Implementation (inspired by the provided services, using third-party APIs)
import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Translate } from '@google-cloud/translate/build/src/v2';

@Injectable()
export class ToolsService {
  private readonly OPEN_EXCHANGE_RATES_URL = 'https://openexchangerates.org/api/latest.json';
  private readonly APP_ID: string;
  private translateClient: Translate;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.APP_ID = this.configService.get<string>('OPEN_EXCHANGE_RATES_API_KEY');
    if (!this.APP_ID) {
      throw new InternalServerErrorException('Open Exchange Rates API key not configured');
    }

    // Initialize Google Translate client
    this.translateClient = new Translate({
      keyFilename: this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS'),
    });
  }

  async convertCurrency(amount: number, targetCurrency: string): Promise<any> {
    try {
      console.log(`Converting amount: ${amount} to currency: ${targetCurrency}`);
      if (amount < 0 || !targetCurrency) {
        throw new BadRequestException('Invalid amount or target currency');
      }

      const response = await firstValueFrom(
        this.httpService.get(this.OPEN_EXCHANGE_RATES_URL, {
          params: {
            app_id: this.APP_ID,
            base: 'USD',
          },
        })
      );

      console.log('Exchange rates response:', response.data);

      const rates = response.data.rates;
      const lkrRate = rates['LKR'];
      const targetRate = rates[targetCurrency.toUpperCase()];

      if (!targetRate) {
        throw new BadRequestException(`Currency ${targetCurrency} is not supported`);
      }

      const amountInUsd = amount / lkrRate;
      const convertedAmount = amountInUsd * targetRate;

      return {
        convertedAmount: parseFloat(convertedAmount.toFixed(2)),
        exchangeRate: parseFloat((1 / lkrRate * targetRate).toFixed(2)), // Effective rate from LKR to target
        fromCurrency: 'LKR',
        toCurrency: targetCurrency.toUpperCase(),
      };
    } catch (error: any) {
      if (error.response) {
        throw new BadRequestException(`API Error: ${error.response.data.message || 'Conversion failed'}`);
      }
      throw new InternalServerErrorException('Unable to fetch exchange rates');
    }
  }

  async translatePhrase(phrase: string, targetLanguage: string, sourceLanguage: string = 'en'): Promise<{ translated_phrase: string; source_language: string; target_language: string }> {
    try {
      if (!phrase || phrase.trim().length === 0 || !targetLanguage) {
        throw new BadRequestException('Invalid phrase or target language');
      }

      const [translation] = await this.translateClient.translate(phrase, {
        from: sourceLanguage,
        to: targetLanguage,
      });

      return {
        translated_phrase: translation,
        source_language: sourceLanguage,
        target_language: targetLanguage,
      };
    } catch (error: any) {
      throw new BadRequestException(`Translation failed: ${error.message}`);
    }
  }

  async getAvailableLanguages(): Promise<{ languages: { code: string; name: string }[] }> {
    try {
      const [languages] = await this.translateClient.getLanguages();

      return {
        languages: languages.map((lang) => ({
          code: lang.code,
          name: lang.name,
        })),
      };
    } catch (error: any) {
      throw new InternalServerErrorException(`Failed to retrieve languages: ${error.message}`);
    }
  }
}