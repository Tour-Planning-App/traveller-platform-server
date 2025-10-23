import { Body, Controller, Post, Get, UseGuards, Inject, Req, Put, Param, Delete } from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { firstValueFrom, catchError } from 'rxjs';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiForbiddenResponse, ApiBody, ApiBadGatewayResponse, ApiNotFoundResponse, ApiInternalServerErrorResponse, ApiBadRequestResponse } from '@nestjs/swagger';
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
  @SubscriptionCheck(0) // Requires Basic plan or higher
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
  @SubscriptionCheck(0) // Basic+ for adding itinerary
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add item to itinerary day' })
  async addItineraryItem(@Param('id') tripId: string, @Param('day') day: number, @Body() dto: any, @Req() req: any) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.AddItineraryItem({ tripId: tripId, userId: userId, day: day, ...dto }).pipe(
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
  @ApiBody({
  description: 'Bucket item details',
  type: 'object', // Or use a simple inline schema
  schema: {
    type: 'object',
    required: ['name', 'description'], // Mark required fields
    properties: {
      name: {
        type: 'string',
        description: 'Name of the bucket list item',
        example: 'Surfing Lesson',
      },
      description: {
        type: 'string',
        description: 'Description of the bucket list item',
        example: 'Learn to surf on golden sands',
      },
      photoUrl: {
        type: 'string',
        description: 'Optional photo URL',
        example: 'https://example.com/photo.jpg',
      },
      address: {
        type: 'string',
        description: 'Optional address/location',
        example: 'Bentota Beach',
      },
    },
  },
})
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
  @SubscriptionCheck(0) // Basic+ for sharing
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

  @Post('trips/:tripId/activities/:activityId/notes')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add note to activity' })
  @ApiBody({
    description: 'Note content details',
    type: 'object',
    schema: {
      type: 'object',
      required: ['content'],
      properties: {
        content: {
          type: 'string',
          description: 'The content of the note for the activity',
          example: 'Pack sunscreen and hat for this activity',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Note added successfully' })
  @ApiBadRequestResponse({ description: 'Invalid note data' })
  @ApiNotFoundResponse({ description: 'Trip or activity not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during note addition' })
  async addNote(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @Body() dto: { content: string },
    @Req() req: any
  ) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.AddNote({ tripId, userId, activityId, ...dto }).pipe(
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

  // Similar for addChecklistItem (endpoint: /trips/:tripId/activities/:activityId/checklist)
  @Post('trips/:tripId/activities/:activityId/checklist')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add checklist item to activity' })
  @ApiBody({
    description: 'Checklist item details',
    type: 'object',
    schema: {
      type: 'object',
      required: ['text'],
      properties: {
        text: {
          type: 'string',
          description: 'The text/description of the checklist item',
          example: 'Book surf lesson for this activity',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Checklist item added successfully' })
  @ApiBadRequestResponse({ description: 'Invalid checklist item data' })
  @ApiNotFoundResponse({ description: 'Trip or activity not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during checklist addition' })
  async addChecklistItem(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @Body() dto: { text: string },
    @Req() req: any
  ) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.AddChecklistItem({ tripId, userId, activityId, ...dto }).pipe(
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

  // Similar for updateChecklistItem (endpoint: /trips/:tripId/activities/:activityId/checklist/:itemId)
  @Put('trips/:tripId/activities/:activityId/checklist/:itemId')
  @UseGuards(JwtAuthGuard, SubscriptionGuard)
  @Roles(Role.TRAVELER)
  @SubscriptionCheck(0)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update checklist item in activity' })
  @ApiBody({
    description: 'Checklist item update details',
    type: 'object',
    schema: {
      type: 'object',
      required: ['completed'],
      properties: {
        completed: {
          type: 'boolean',
          description: 'Whether the checklist item is completed',
          example: true,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Checklist item updated successfully' })
  @ApiBadRequestResponse({ description: 'Invalid checklist item data' })
  @ApiNotFoundResponse({ description: 'Trip, activity, or item not found' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during checklist update' })
  async updateChecklistItem(
    @Param('tripId') tripId: string,
    @Param('activityId') activityId: string,
    @Param('itemId') itemId: string,
    @Body() dto: { completed: boolean },
    @Req() req: any
  ) {
    const userId = req.user.userId;
    try {
      const result = await firstValueFrom(
        this.itinerariesService.UpdateChecklistItem({ tripId, userId, activityId, itemId, ...dto }).pipe(
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

  // @Post(':id/note/:day')
  // @UseGuards(JwtAuthGuard, SubscriptionGuard)
  // @Roles(Role.TRAVELER)
  // @SubscriptionCheck(0)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Add note to day' })
  // @ApiBody({
  //   description: 'Note content details',
  //   type: 'object',
  //   schema: {
  //     type: 'object',
  //     required: ['content'],
  //     properties: {
  //       content: {
  //         type: 'string',
  //         description: 'The content of the note for the day',
  //         example: 'Pack sunscreen and hat for beach day',
  //       },
  //     },
  //   },
  // })
  // async addNote(@Param('id') tripId: string, @Param('day') day: number, @Body() { content }: { content: string }, @Req() req: any) {
  //   const userId = req.user.userId;
  //   try {
  //     const result = await firstValueFrom(
  //       this.itinerariesService.AddNote({ tripId: tripId, userId: userId, day: day.toString(), content }).pipe(
  //         catchError((error) => {
  //           this.logger.error(`AddNote error: ${error.message}`);
  //           throw new HttpException('Failed to add note', HttpStatus.BAD_REQUEST);
  //         })
  //       )
  //     );
  //     return result;
  //   } catch (error: any) {
  //     throw error;
  //   }
  // }

//  @Post(':id/checklist/:day')
//   @UseGuards(JwtAuthGuard, SubscriptionGuard)
//   @Roles(Role.TRAVELER)
//   @SubscriptionCheck(0)
//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Add checklist item to day' })
//   @ApiBody({
//     description: 'Checklist item details',
//     type: 'object',
//     schema: {
//       type: 'object',
//       required: ['text'],
//       properties: {
//         text: {
//           type: 'string',
//           description: 'The text/description of the checklist item',
//           example: 'Book surf lesson',
//         },
//       },
//     },
//   })
//   @ApiResponse({ status: 201, description: 'Checklist item added successfully' })
//   @ApiBadRequestResponse({ description: 'Invalid checklist item data' })
//   @ApiNotFoundResponse({ description: 'Trip or day not found' })
//   @ApiInternalServerErrorResponse({ description: 'Internal server error during checklist addition' })
//   async addChecklistItem(@Param('id') tripId: string, @Param('day') day: number, @Body() { text }: { text: string }, @Req() req: any) {
//     const userId = req.user.userId;
//     try {
//       const result = await firstValueFrom(
//         this.itinerariesService.AddChecklistItem({ tripId: tripId, userId: userId, day: day.toString(), text }).pipe(
//           catchError((error) => {
//             this.logger.error(`AddChecklistItem error: ${error.message}`);
//             throw new HttpException('Failed to add checklist item', HttpStatus.BAD_REQUEST);
//           })
//         )
//       );
//       return result;
//     } catch (error: any) {
//       throw error;
//     }
//   }

//   @Put(':id/checklist/:day/:itemId')
//   @UseGuards(JwtAuthGuard, SubscriptionGuard)
//   @Roles(Role.TRAVELER)
//   @SubscriptionCheck(0)
//   @ApiBearerAuth()
//   @ApiOperation({ summary: 'Update checklist item' })
//   @ApiBody({
//     description: 'Checklist item update details',
//     type: 'object',
//     schema: {
//       type: 'object',
//       required: ['completed'],
//       properties: {
//         completed: {
//           type: 'boolean',
//           description: 'Whether the checklist item is completed',
//           example: true,
//         },
//       },
//     },
//   })
//   @ApiResponse({ status: 200, description: 'Checklist item updated successfully' })
//   @ApiBadRequestResponse({ description: 'Invalid checklist item data' })
//   @ApiNotFoundResponse({ description: 'Trip, day, or item not found' })
//   @ApiInternalServerErrorResponse({ description: 'Internal server error during checklist update' })
//   async updateChecklistItem(@Param('id') tripId: string, @Param('day') day: number, @Param('itemId') itemId: string, @Body() { completed }: { completed: boolean }, @Req() req: any) {
//     const userId = req.user.userId;
//     try {
//       const result = await firstValueFrom(
//         this.itinerariesService.UpdateChecklistItem({ tripId: tripId, userId: userId, day: day.toString(), itemId: itemId, completed }).pipe(
//           catchError((error) => {
//             this.logger.error(`UpdateChecklistItem error: ${error.message}`);
//             throw new HttpException('Failed to update checklist item', HttpStatus.BAD_REQUEST);
//           })
//         )
//       );
//       return result;
//     } catch (error: any) {
//       throw error;
//     }
//   }

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
  @ApiBody({
    description: 'Activity type details for the moved item',
    type: 'object',
    schema: {
      type: 'object',
      properties: {
        activityType: {
          type: 'string',
          description: 'The type of activity to categorize the bucket item as (defaults to "activity")',
          example: 'place',
          enum: ['place', 'stay', 'food', 'activity'],
        },
      },
    },
  })
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
  @ApiBody({
    description: 'Search query for auto-filling the location',
    type: 'object',
    schema: {
      type: 'object',
      required: ['query'],
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find and auto-fill the location (e.g., "beach waterfall near Ella")',
          example: 'beach waterfall near Ella',
        },
      },
    },
  })
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