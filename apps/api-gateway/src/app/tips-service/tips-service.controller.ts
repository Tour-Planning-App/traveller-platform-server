// tips.http.controller.ts (HTTP gateway for Tips, similar to community)
import { Body, Controller, Get, Post, Put, Delete, Param, Query, Req, UseGuards, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError, throwError } from 'rxjs';
import { ApiBearerAuth, ApiBadRequestResponse, ApiInternalServerErrorResponse, ApiNotFoundResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Logger } from '@nestjs/common';
import {
  CreateCategoryDto, 
  GetCategoriesDto, 
  GetCategoryByIdDto, 
  UpdateCategoryDto, 
  DeleteCategoryDto, 
  CreateTipDto, 
  GetTipsDto, 
  GetTipByIdDto, 
  UpdateTipDto, 
  DeleteTipDto, 
  GetAllUsersDto, 
} from './dtos/tips.dto';

@ApiTags('Tips')
@Controller('tips')
export class TipsServiceController {
    private tipsService: any;
  private readonly logger = new Logger(TipsServiceController.name);

  constructor(@Inject('TIPS_PACKAGE') private client: ClientGrpcProxy) {
    this.tipsService = this.client.getService('TipsService');
  }

// Category endpoints (Admin only for CRUD)
  @Post('categories')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create category (Admin only)' })
  async createCategory(@Body() dto: CreateCategoryDto, @Req() req: any) {
    try {
      const adminId = req?.user?.userId;
      if (!adminId || req?.user?.role !== 'admin') {
        throw new HttpException('Admin access required', HttpStatus.UNAUTHORIZED);
      }
      const data = { ...dto, adminId };
      const result = await firstValueFrom(
        this.tipsService.CreateCategory(data).pipe(
          catchError((error) => throwError(() => this.handleError(error)))
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`CreateCategory failed: ${error.message}`);
      throw error;
    }
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all categories' })
  async getCategories(@Query() dto: GetCategoriesDto) {
    try {
      const data = { ...dto };
      const result = await firstValueFrom(
        this.tipsService.GetCategories(data).pipe(
          catchError((error) => throwError(() => this.handleError(error)))
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetCategories failed: ${error.message}`);
      throw error;
    }
  }

  @Get('categories/:id')
  @ApiOperation({ summary: 'Get category by ID' })
  async getCategoryById(@Param('id') id: string) {
    try {
      const data: GetCategoryByIdDto = { categoryId: id };
      const result = await firstValueFrom(
        this.tipsService.GetCategoryById(data).pipe(
          catchError((error) => throwError(() => this.handleError(error)))
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetCategoryById failed: ${error.message}`);
      throw error;
    }
  }

  @Put('categories/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update category (Admin only)' })
  async updateCategory(@Param('id') id: string, @Body() dto: Omit<UpdateCategoryDto, 'categoryId' | 'adminId'>, @Req() req: any) {
    try {
      const adminId = req?.user?.userId;
      if (!adminId || req?.user?.role !== 'admin') {
        throw new HttpException('Admin access required', HttpStatus.UNAUTHORIZED);
      }
      const data: UpdateCategoryDto = { ...dto, categoryId: id, adminId };
      const result = await firstValueFrom(
        this.tipsService.UpdateCategory(data).pipe(
          catchError((error) => throwError(() => this.handleError(error)))
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`UpdateCategory failed: ${error.message}`);
      throw error;
    }
  }

  @Delete('categories/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  async deleteCategory(@Param('id') id: string, @Req() req: any) {
    try {
      const adminId = req?.user?.userId;
      if (!adminId || req?.user?.role !== 'admin') {
        throw new HttpException('Admin access required', HttpStatus.UNAUTHORIZED);
      }
      const data: DeleteCategoryDto = { categoryId: id, adminId };
      const result = await firstValueFrom(
        this.tipsService.DeleteCategory(data).pipe(
          catchError((error) => throwError(() => this.handleError(error)))
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`DeleteCategory failed: ${error.message}`);
      throw error;
    }
  }

  // Tip endpoints (Admin only for CRUD, public for read)
  @Post('tips')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create tip (Admin only)' })
  async createTip(@Body() dto: CreateTipDto, @Req() req: any) {
    try {
      const adminId = req?.user?.userId;
      if (!adminId || req?.user?.role !== 'admin') {
        throw new HttpException('Admin access required', HttpStatus.UNAUTHORIZED);
      }
      const data = { ...dto, adminId };
      const result = await firstValueFrom(
        this.tipsService.CreateTip(data).pipe(
          catchError((error) => throwError(() => this.handleError(error)))
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`CreateTip failed: ${error.message}`);
      throw error;
    }
  }

  @Get('tips')
  @ApiOperation({ summary: 'Get tips' })
  async getTips(@Query() dto: GetTipsDto) {
    try {
      const data = { ...dto };
      const result = await firstValueFrom(
        this.tipsService.GetTips(data).pipe(
          catchError((error) => throwError(() => this.handleError(error)))
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetTips failed: ${error.message}`);
      throw error;
    }
  }

  @Get('tips/:id')
  @ApiOperation({ summary: 'Get tip by ID' })
  async getTipById(@Param('id') id: string) {
    try {
      const data: GetTipByIdDto = { tipId: id };
      const result = await firstValueFrom(
        this.tipsService.GetTipById(data).pipe(
          catchError((error) => throwError(() => this.handleError(error)))
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetTipById failed: ${error.message}`);
      throw error;
    }
  }

  @Put('tips/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update tip (Admin only)' })
  async updateTip(@Param('id') id: string, @Body() dto: Omit<UpdateTipDto, 'tipId' | 'adminId'>, @Req() req: any) {
    try {
      const adminId = req?.user?.userId;
      if (!adminId || req?.user?.role !== 'admin') {
        throw new HttpException('Admin access required', HttpStatus.UNAUTHORIZED);
      }
      const data: UpdateTipDto = { ...dto, tipId: id, adminId };
      const result = await firstValueFrom(
        this.tipsService.UpdateTip(data).pipe(
          catchError((error) => throwError(() => this.handleError(error)))
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`UpdateTip failed: ${error.message}`);
      throw error;
    }
  }

  @Delete('tips/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete tip (Admin only)' })
  async deleteTip(@Param('id') id: string, @Req() req: any) {
    try {
      const adminId = req?.user?.userId;
      if (!adminId || req?.user?.role !== 'admin') {
        throw new HttpException('Admin access required', HttpStatus.UNAUTHORIZED);
      }
      const data: DeleteTipDto = { tipId: id, adminId };
      const result = await firstValueFrom(
        this.tipsService.DeleteTip(data).pipe(
          catchError((error) => throwError(() => this.handleError(error)))
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`DeleteTip failed: ${error.message}`);
      throw error;
    }
  }

  // Admin: Get all users
  @Get('users')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  async getAllUsers(@Query() dto: Omit<GetAllUsersDto, 'adminId'>, @Req() req: any) {
    try {
      const adminId = req?.user?.userId;
      if (!adminId || req?.user?.role !== 'admin') {
        throw new HttpException('Admin access required', HttpStatus.UNAUTHORIZED);
      }
      const data: GetAllUsersDto = { ...dto, adminId };
      const result = await firstValueFrom(
        this.tipsService.GetAllUsers(data).pipe(
          catchError((error) => throwError(() => this.handleError(error)))
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetAllUsers failed: ${error.message}`);
      throw error;
    }
  }

  private handleError(error: any): HttpException {
    this.logger.error(`gRPC error: ${error.message}`, error.stack);
    if (error.code === 2 || error.code === 'INTERNAL') {
      return new HttpException('Internal server error', HttpStatus.INTERNAL_SERVER_ERROR);
    } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
      return new HttpException('Invalid data', HttpStatus.BAD_REQUEST);
    } else if (error.details && error.details.includes('not found')) {
      return new HttpException('Resource not found', HttpStatus.NOT_FOUND);
    } else {
      return new HttpException('Operation failed', HttpStatus.BAD_REQUEST);
    }
  }
}
