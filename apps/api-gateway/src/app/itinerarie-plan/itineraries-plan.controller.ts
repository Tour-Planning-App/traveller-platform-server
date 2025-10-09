import { Body, Controller, Post, Get, UseGuards, Inject, Req } from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError } from 'rxjs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiForbiddenResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SubscriptionGuard } from '../auth/guards/subscription.guard';
import { SubscriptionCheck } from '../auth/decorators/public.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/decorators/role.enum';
import { Logger } from '@nestjs/common';
import { HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common';
import { CreateItineraryDto, ItineraryResponseDto } from './dtos/itineraries.dto'; // Assume DTO file

@ApiTags('Itineraries')
@Controller('itineraries-plan')
export class ItinerariesPlanController {
  private itinerariesService: any;
  private readonly logger = new Logger(ItinerariesPlanController.name);

  constructor(@Inject('ITINERARIES_PACKAGE') private client: ClientGrpcProxy) {
    this.itinerariesService = this.client.getService('ItinerariesService');
  }

  @Post('create')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(1) // Requires Basic plan or higher
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new itinerary plan' })
  @ApiResponse({ status: 200, description: 'Itinerary created', type: ItineraryResponseDto })
  @ApiForbiddenResponse({ description: 'Insufficient plan level' })
  async createItinerary(@Body() dto: CreateItineraryDto, @Req() req: any) {
    this.logger.log(`Creating itinerary for user: ${dto.userId}`);
    try {
      const response = await firstValueFrom(
        this.itinerariesService.CreateItinerary(dto).pipe(
          catchError((error) => {
            this.logger.error(`CreateItinerary error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during itinerary creation', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid itinerary data', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Failed to create itinerary', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return response;
    } catch (error: any) {
      this.logger.error(`CreateItinerary failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('my-itineraries')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0) // Any active plan (including Free)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user\'s itineraries' })
  @ApiResponse({ status: 200, description: 'Itineraries fetched', type: [ItineraryResponseDto] })
  @ApiForbiddenResponse({ description: 'Active subscription required' })
  async getItineraries(@Req() req: any) {
    const userId = req.user.userId;
    this.logger.log(`Fetching itineraries for user: ${userId}`);
    try {
      const response = await firstValueFrom(
        this.itinerariesService.GetItineraries({ userId }).pipe(
          catchError((error) => {
            this.logger.error(`GetItineraries error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during fetch', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid user ID', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Failed to fetch itineraries', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return response;
    } catch (error: any) {
      this.logger.error(`GetItineraries failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}