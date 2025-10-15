// tips.controller.ts
import { Controller, Logger, BadRequestException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TipsService } from './tips.service';
import {
  CreateCategoryDto, CreateCategoryResponseDto,
  GetCategoriesDto, GetCategoriesResponseDto, GetCategoryResponseDto,
  UpdateCategoryDto, UpdateCategoryResponseDto,
  DeleteCategoryDto, DeleteCategoryResponseDto,
  CreateTipDto, CreateTipResponseDto,
  GetTipsDto, GetTipsResponseDto, GetTipResponseDto,
  UpdateTipDto, UpdateTipResponseDto,
  DeleteTipDto, DeleteTipResponseDto,
  GetAllUsersDto, GetAllUsersResponseDto,
} from './dtos/tips.dto';
import { GrpcMethod, Payload, RpcException } from '@nestjs/microservices';

@ApiTags('Tips')
@Controller()
export class TipsController {
  private readonly logger = new Logger(TipsController.name);

  constructor(private readonly tipsService: TipsService) {}

  @GrpcMethod('TipsService', 'CreateCategory')
  async createCategory(@Payload() data: CreateCategoryDto): Promise<CreateCategoryResponseDto> {
    try {
      const result = await this.tipsService.createCategory(data);
      return {
        success: result.success,
        message: result.message,
        category: result.category,
      };
    } catch (error: any) {
      this.logger.error(`gRPC CreateCategory error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TipsService', 'GetCategories')
  async getCategories(@Payload() data: GetCategoriesDto): Promise<GetCategoriesResponseDto> {
    try {
      const result = await this.tipsService.getCategories(data);
      return {
        success: result.success,
        categories: result.categories,
        total: result.total,
      };
    } catch (error: any) {
      this.logger.error(`gRPC GetCategories error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TipsService', 'GetCategoryById')
  async getCategoryById(@Payload() data: any): Promise<GetCategoryResponseDto> {
    try {
      const result = await this.tipsService.getCategoryById(data);
      return {
        success: result.success,
        category: result.category,
      };
    } catch (error: any) {
      this.logger.error(`gRPC GetCategoryById error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TipsService', 'UpdateCategory')
  async updateCategory(@Payload() data: UpdateCategoryDto): Promise<UpdateCategoryResponseDto> {
    try {
      const result = await this.tipsService.updateCategory(data);
      return {
        success: result.success,
        message: result.message,
        category: result.category,
      };
    } catch (error: any) {
      this.logger.error(`gRPC UpdateCategory error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TipsService', 'DeleteCategory')
  async deleteCategory(@Payload() data: DeleteCategoryDto): Promise<DeleteCategoryResponseDto> {
    try {
      const result = await this.tipsService.deleteCategory(data);
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error: any) {
      this.logger.error(`gRPC DeleteCategory error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TipsService', 'CreateTip')
  async createTip(@Payload() data: CreateTipDto): Promise<CreateTipResponseDto> {
    try {
      const result = await this.tipsService.createTip(data);
      return {
        success: result.success,
        message: result.message,
        tip: result.tip,
      };
    } catch (error: any) {
      this.logger.error(`gRPC CreateTip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TipsService', 'GetTips')
  async getTips(@Payload() data: GetTipsDto): Promise<GetTipsResponseDto> {
    try {
      const result = await this.tipsService.getTips(data);
      return {
        success: result.success,
        tips: result.tips,
        total: result.total,
      };
    } catch (error: any) {
      this.logger.error(`gRPC GetTips error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TipsService', 'GetTipById')
  async getTipById(@Payload() data: any): Promise<GetTipResponseDto> {
    try {
      const result = await this.tipsService.getTipById(data);
      return {
        success: result.success,
        tip: result.tip,
      };
    } catch (error: any) {
      this.logger.error(`gRPC GetTipById error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TipsService', 'UpdateTip')
  async updateTip(@Payload() data: UpdateTipDto): Promise<UpdateTipResponseDto> {
    try {
      const result = await this.tipsService.updateTip(data);
      return {
        success: result.success,
        message: result.message,
        tip: result.tip,
      };
    } catch (error: any) {
      this.logger.error(`gRPC UpdateTip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TipsService', 'DeleteTip')
  async deleteTip(@Payload() data: DeleteTipDto): Promise<DeleteTipResponseDto> {
    try {
      const result = await this.tipsService.deleteTip(data);
      return {
        success: result.success,
        message: result.message,
      };
    } catch (error: any) {
      this.logger.error(`gRPC DeleteTip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TipsService', 'GetAllUsers')
  async getAllUsers(@Payload() data: GetAllUsersDto): Promise<GetAllUsersResponseDto> {
    try {
      const result = await this.tipsService.getAllUsers(data);
      return {
        success: result.success,
        users: result.users,
        total: result.total,
      };
    } catch (error: any) {
      this.logger.error(`gRPC GetAllUsers error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }
}