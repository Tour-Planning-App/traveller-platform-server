import { Body, Controller, Get, Post, Query, Req, UseGuards, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError } from 'rxjs';
import { ApiBearerAuth, ApiBadRequestResponse, ApiBody, ApiInternalServerErrorResponse, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Logger } from '@nestjs/common';

@Controller('tools-service')
export class ToolsServiceController {
    private toolsService: any;
  private readonly logger = new Logger(ToolsServiceController.name);

  constructor(@Inject('TOOLS_PACKAGE') private client: ClientGrpcProxy) {
    this.toolsService = this.client.getService('ToolsService');
  }

  @Post('currency/convert')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Convert currency (assumes input in LKR)' })
  @ApiBody({
    description: 'Currency conversion details',
    type: 'object',
    schema: {
      type: 'object',
      required: ['amount', 'target_currency'],
      properties: {
        amount: {
          type: 'number',
          description: 'Amount in LKR to convert',
          example: 30190.00,
        },
        target_currency: {
          type: 'string',
          description: 'Target currency code (e.g., USD, GBP)',
          example: 'USD',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Currency converted successfully' })
  @ApiBadRequestResponse({ description: 'Invalid amount or currency' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during conversion' })
  async convertCurrency(@Body() body: { amount: number; target_currency: string }, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data = { amount: body.amount, target_currency: body.target_currency };

      const result = await firstValueFrom(
        this.toolsService.ConvertCurrency(data).pipe(
          catchError((error: any) => {
            this.logger.error(`ConvertCurrency error: ${error.message}`, error.stack);
            if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid amount or currency', HttpStatus.BAD_REQUEST);
            } else if (error.code === 13 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during conversion', HttpStatus.INTERNAL_SERVER_ERROR);
            } else {
              throw new HttpException('Conversion failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`ConvertCurrency failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('translate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Translate phrase to target language' })
  @ApiBody({
    description: 'Translation details',
    type: 'object',
    schema: {
      type: 'object',
      required: ['phrase', 'target_language'],
      properties: {
        phrase: {
          type: 'string',
          description: 'Text to translate',
          example: 'Hi just arrived in Sri Lanka and I\'m really excited to explore the beaches, the temples, and the food...',
        },
        target_language: {
          type: 'string',
          description: 'Target language code (e.g., si for Sinhala)',
          example: 'si',
        },
        source_language: {
          type: 'string',
          description: 'Source language code (default: en)',
          example: 'en',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Phrase translated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid phrase or language' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during translation' })
  async translatePhrase(@Body() body: { phrase: string; target_language: string; source_language?: string }, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data = { phrase: body.phrase, target_language: body.target_language, source_language: body.source_language || 'en' };

      const result = await firstValueFrom(
        this.toolsService.TranslatePhrase(data).pipe(
          catchError((error: any) => {
            this.logger.error(`TranslatePhrase error: ${error.message}`, error.stack);
            if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid phrase or language', HttpStatus.BAD_REQUEST);
            } else if (error.code === 13 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during translation', HttpStatus.INTERNAL_SERVER_ERROR);
            } else {
              throw new HttpException('Translation failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`TranslatePhrase failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('languages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get available languages for translation' })
  @ApiResponse({ status: 200, description: 'Available languages retrieved successfully' })
  @ApiBadRequestResponse({ description: 'Invalid request' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during language fetch' })
  async getAvailableLanguages(@Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const data = {}; // Empty payload for GetLanguages

      const result = await firstValueFrom(
        this.toolsService.GetLanguages(data).pipe(
          catchError((error: any) => {
            this.logger.error(`GetLanguages error: ${error.message}`, error.stack);
            if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid request', HttpStatus.BAD_REQUEST);
            } else if (error.code === 13 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during language fetch', HttpStatus.INTERNAL_SERVER_ERROR);
            } else {
              throw new HttpException('Language fetch failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetLanguages failed: ${error.message}`, error.stack);
      throw error;
    }
  }

}
