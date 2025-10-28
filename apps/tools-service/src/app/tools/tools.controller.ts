// tools.controller.ts - gRPC Controller (inspired by the provided HTTP controllers, now gRPC)
import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { BadRequestException } from '@nestjs/common';
import { ToolsService } from './tools.service';

@Controller('tools')
export class ToolsController {
  private readonly logger = new Logger(ToolsController.name);

  constructor(private readonly toolsService: ToolsService) {}

  @GrpcMethod('ToolsService', 'ConvertCurrency')
  async convertCurrency(@Payload() data: { amount: number; targetCurrency: string }) {
    try {
      console.log('Received convertCurrency request:', data);
      const result = await this.toolsService.convertCurrency(data.amount, data.targetCurrency);
      console.log('Conversion result:', result);
      return { success: true, message: 'Currency converted successfully', ...result };
    } catch (error: any) {
      this.logger.error(`gRPC ConvertCurrency error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 13, // 13 for INTERNAL
        message: error.message,
      });
    }
  }

  @GrpcMethod('ToolsService', 'TranslatePhrase')
  async translatePhrase(@Payload() data: { phrase: string; target_language: string; source_language?: string }) {
    try {
      console.log('Received translatePhrase request:', data);
      const result = await this.toolsService.translatePhrase(data.phrase, data.target_language, data.source_language || 'en');
      return { success: true, message: 'Phrase translated successfully', ...result };
    } catch (error: any) {
      this.logger.error(`gRPC TranslatePhrase error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 13,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ToolsService', 'GetLanguages')
  async getLanguages(@Payload() data: any) { // Empty payload
    try {
      console.log('Received getLanguages request');
      const result = await this.toolsService.getAvailableLanguages();
      return { success: true, message: 'Available languages retrieved successfully', ...result };
    } catch (error: any) {
      this.logger.error(`gRPC GetLanguages error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 13,
        message: error.message,
      });
    }
  }
}