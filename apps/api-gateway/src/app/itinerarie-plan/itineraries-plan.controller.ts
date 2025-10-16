import { Body, Controller, Post, Get, UseGuards, Inject, Req, Put, Param, Delete } from '@nestjs/common';
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
import { AddItineraryItemDto, CreateAITripDto, CreateTripDto, UpdateTripDto, SearchLocationsDto } from './dtos/trip.dto';
import { LocationSuggestionDto } from './dtos/trip.dto';

@ApiTags('Itineraries')
@Controller('itineraries-plan')
export class ItinerariesPlanController {
  private itinerariesService: any;
  private readonly logger = new Logger(ItinerariesPlanController.name);

  constructor(@Inject('ITINERARIES_PACKAGE') private client: ClientGrpcProxy) {
    this.itinerariesService = this.client.getService('ItinerariesService');
  }

  @Post()
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new trip' })
  @ApiResponse({ status: 201, description: 'Trip created' })
  async createTrip(@Body() dto: CreateTripDto, @Req() req: any) {
    console.log('CreateTrip called with DTO:', req.user);
    const userId = req.user.userId;
    try {
      const result: { trip: any } = await firstValueFrom(
        this.itinerariesService.CreateTrip({ userId: userId, ...dto }).pipe(
          catchError((error) => {
            this.logger.error(`CreateTrip error: ${error.message}`);
            throw new HttpException('Failed to create trip', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result.trip;
    } catch (error: any) {
      throw error;
    }
  }

  @Post('ai') // Route for "Plan it for me"
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(1) // Requires Basic plan or higher
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new AI-generated trip plan' })
  @ApiResponse({ status: 201, description: 'AI Trip created', type: CreateTripDto }) // Assume Trip type imported
  @ApiForbiddenResponse({ description: 'Insufficient plan level' })
  async createAITrip(@Body() dto: CreateAITripDto, @Req() req: any) {
    this.logger.log(`Creating AI itinerary for user: ${req.user.userId}, destination: ${dto.destination}`);
    try {
      const userId = req.user.userId;
      const response = await firstValueFrom(
        this.itinerariesService.CreateAITrip({ userId, ...dto }).pipe(
          catchError((error) => {
            this.logger.error(`CreateAITrip error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during AI plan creation', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid AI plan data', HttpStatus.BAD_REQUEST);
            } else if (error.code === 7 || error.code === 'PERMISSION_DENIED') {
              throw new HttpException('Subscription required for AI planning', HttpStatus.FORBIDDEN);
            } else {
              throw new HttpException('Failed to create AI plan', HttpStatus.BAD_REQUEST);
            }
          })
        )
      ) as any;
      return response.trip; // Redirects to dashboard with pre-populated trip
    } catch (error: any) {
      this.logger.error(`CreateAITrip failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update trip (dates, budget)' })
  async updateTrip(@Param('id') id: string, @Body() dto: UpdateTripDto, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.UpdateTrip({ id, userId: userId, ...dto }).pipe(
          catchError((error) => {
            this.logger.error(`UpdateTrip error: ${error.message}`);
            throw new HttpException('Failed to update trip', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trip details' })
  async getTrip(@Param('id') id: string) {
    try {
      const result = await firstValueFrom(
        this.itinerariesService.GetTrip({ id }).pipe(
          catchError((error) => {
            this.logger.error(`GetTrip error: ${error.message}`);
            throw new HttpException('Trip not found', HttpStatus.NOT_FOUND);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Get()
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user trips' })
  async getUserTrips(@Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.GetUserTrips({ userId: userId }).pipe(
          catchError((error) => {
            this.logger.error(`GetUserTrips error: ${error.message}`);
            throw new HttpException('Failed to fetch trips', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete trip' })
  async deleteTrip(@Param('id') id: string, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.DeleteTrip({ id, userId: userId }).pipe(
          catchError((error) => {
            this.logger.error(`DeleteTrip error: ${error.message}`);
            throw new HttpException('Failed to delete trip', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Post(':id/itinerary/:day')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(1) // Basic+ for adding itinerary
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to itinerary day' })
  async addItineraryItem(@Param('id') tripId: string, @Param('day') day: number, @Body() dto: AddItineraryItemDto, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.AddItineraryItem({ tripId: tripId, userId: userId, day: day.toString(), ...dto }).pipe(
          catchError((error) => {
            this.logger.error(`AddItineraryItem error: ${error.message}`);
            throw new HttpException('Failed to add itinerary item', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Delete(':id/itinerary/:day/:activityId')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove item from itinerary day' })
  async removeItineraryItem(@Param('id') tripId: string, @Param('day') day: number, @Param('activityId') activityId: string, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.RemoveItineraryItem({ tripId: tripId, userId: userId, day: day.toString(), activityId: activityId }).pipe(
          catchError((error) => {
            this.logger.error(`RemoveItineraryItem error: ${error.message}`);
            throw new HttpException('Failed to remove itinerary item', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Post(':id/bucket')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add to bucket list' })
  async addBucketItem(@Param('id') tripId: string, @Body() { name, description, photoUrl, address }: { name: string; description: string; photoUrl?: string; address?: string }, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.AddBucketItem({ tripId: tripId, userId: userId, name, description, photoUrl, address }).pipe(
          catchError((error) => {
            this.logger.error(`AddBucketItem error: ${error.message}`);
            throw new HttpException('Failed to add bucket item', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Delete(':id/bucket/:itemId')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove from bucket list' })
  async removeBucketItem(@Param('id') tripId: string, @Param('itemId') itemId: string, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.RemoveBucketItem({ tripId: tripId, userId: userId, itemId: itemId }).pipe(
          catchError((error) => {
            this.logger.error(`RemoveBucketItem error: ${error.message}`);
            throw new HttpException('Failed to remove bucket item', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Post(':id/share')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(1) // Basic+ for sharing
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Share trip' })
  async shareTrip(@Param('id') tripId: string, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result : any= await firstValueFrom(
        this.itinerariesService.ShareTrip({ tripId: tripId, userId: userId }).pipe(
          catchError((error) => {
            this.logger.error(`ShareTrip error: ${error.message}`);
            throw new HttpException('Failed to share trip', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return { shareToken: result.shareToken };
    } catch (error: any) {
      throw error;
    }
  }

  @Post(':id/note/:day')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add note to day' })
  async addNote(@Param('id') tripId: string, @Param('day') day: number, @Body() { content }: { content: string }, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.AddNote({ tripId: tripId, userId: userId, day: day.toString(), content }).pipe(
          catchError((error) => {
            this.logger.error(`AddNote error: ${error.message}`);
            throw new HttpException('Failed to add note', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Post(':id/checklist/:day')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add checklist item to day' })
  async addChecklistItem(@Param('id') tripId: string, @Param('day') day: number, @Body() { text }: { text: string }, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.AddChecklistItem({ tripId: tripId, userId: userId, day: day.toString(), text }).pipe(
          catchError((error) => {
            this.logger.error(`AddChecklistItem error: ${error.message}`);
            throw new HttpException('Failed to add checklist item', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Put(':id/checklist/:day/:itemId')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update checklist item' })
  async updateChecklistItem(@Param('id') tripId: string, @Param('day') day: number, @Param('itemId') itemId: string, @Body() { completed }: { completed: boolean }, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.UpdateChecklistItem({ tripId: tripId, userId: userId, day: day.toString(), itemId: itemId, completed }).pipe(
          catchError((error) => {
            this.logger.error(`UpdateChecklistItem error: ${error.message}`);
            throw new HttpException('Failed to update checklist item', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Put(':id/optimize/:day')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Optimize route for a specific day' })
  @ApiResponse({ status: 200, description: 'Day route optimized' })
  async optimizeDay(@Param('id') tripId: string, @Param('day') day: number, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.OptimizeDay({ tripId: tripId, userId, day: day.toString() }).pipe(
          catchError((error) => {
            this.logger.error(`OptimizeDay error: ${error.message}`);
            throw new HttpException('Failed to optimize day route', HttpStatus.BAD_REQUEST);
          })
        )
      ) as any;
      return { ...result, day: result.day }; // Return updated day
    } catch (error: any) {
      throw error;
    }
  }

  @Post(':id/move-bucket/:itemId/:day')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Move bucket item to itinerary day' })
  async moveBucketToItinerary(@Param('id') tripId: string, @Param('itemId') itemId: string, @Param('day') day: number, @Body() { activityType = 'activity' }: { activityType?: string }, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.MoveBucketToItinerary({ tripId: tripId, userId: userId, itemId: itemId, day: day.toString(), activityType }).pipe(
          catchError((error) => {
            this.logger.error(`MoveBucketToItinerary error: ${error.message}`);
            throw new HttpException('Failed to move bucket item to itinerary', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Post(':id/autofill/:day/:activityId')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Auto-fill location for activity' })
  async autoFillLocation(@Param('id') tripId: string, @Param('day') day: number, @Param('activityId') activityId: string, @Body() { query }: { query: string }, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.AutoFillLocation({ tripId: tripId, userId: userId, day: day.toString(), activityId: activityId, query }).pipe(
          catchError((error) => {
            this.logger.error(`AutoFillLocation error: ${error.message}`);
            throw new HttpException('Failed to auto-fill location', HttpStatus.BAD_REQUEST);
          })
        )
      );
      return result;
    } catch (error: any) {
      throw error;
    }
  }

  @Post(':id/search-locations')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search locations for trip' })
  @ApiResponse({ status: 200, description: 'Location suggestions', type: [LocationSuggestionDto] })
  async searchLocations(@Param('id') tripId: string, @Body() dto: SearchLocationsDto, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.SearchLocations({ tripId: tripId, userId: userId, ...dto }).pipe(
          catchError((error) => {
            this.logger.error(`SearchLocations error: ${error.message}`);
            throw new HttpException('Failed to search locations', HttpStatus.BAD_REQUEST);
          })
        )
      ) as any;
      return result.suggestions;
    } catch (error: any) {
      throw error;
    }
  }
}