import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { CreateTripDto, UpdateTripDto, AddItineraryItemDto, CreateAITripDto, SearchLocationsDto } from './dtos/trip.dto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ItinerariesService } from './itineraries.service';

@Controller('itineraries')
export class ItinerariesController {
    private readonly logger = new Logger(ItinerariesController.name);

  constructor(private readonly tripService: ItinerariesService) {}

  @GrpcMethod('ItinerariesService', 'CreateTrip')
  async createTrip(@Payload() data: { userId: string } & CreateTripDto) {
    try {
      const { userId, ...dto } = data;
      console.log('Received createTrip request for userId:', userId, 'with data:', dto);
      const result = await this.tripService.createTrip(userId, dto);
      return { success: true, message: 'Trip created successfully', trip: result };
    } catch (error: any) {
      this.logger.error(`gRPC CreateTrip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof ForbiddenException ? 7 : (error instanceof BadRequestException ? 3 : 2),
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'CreateAITrip')
  async createAITrip(@Payload() data: { userId: string } & CreateAITripDto) {
    try {
      const { userId, ...dto } = data;
      console.log('Received createAITrip request for userId:', userId, 'with data:', dto);
      const result = await this.tripService.createAITrip(userId, dto);
      return { success: true, message: 'AI Trip created successfully', trip: result };
    } catch (error: any) {
      this.logger.error(`gRPC CreateAITrip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof ForbiddenException ? 7 : (error instanceof BadRequestException ? 3 : 2),
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'UpdateTrip')
  async updateTrip(@Payload() data: { id: string; userId: string } & UpdateTripDto) {
    try {
      const { id, userId, ...dto } = data;
      const result = await this.tripService.updateTrip(id, dto, userId);
      return { success: true, message: 'Trip updated successfully', trip: result };
    } catch (error: any) {
      this.logger.error(`gRPC UpdateTrip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'GetTrip')
  async getTrip(@Payload() data: { id: string }) {
    try {
      const result = await this.tripService.getTrip(data.id);
      console.log(result)
      return { success: true, trip: result };
    } catch (error: any) {
      this.logger.error(`gRPC GetTrip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'GetUserTrips')
  async getUserTrips(@Payload() data: { userId: string }) {
    try {
      const result = await this.tripService.getUserTrips(data.userId);
      return { success: true, trips: result };
    } catch (error: any) {
      this.logger.error(`gRPC GetUserTrips error: ${error.message}`, error.stack);
      throw new RpcException({
        code: 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'DeleteTrip')
  async deleteTrip(@Payload() data: { id: string; userId: string }) {
    try {
      await this.tripService.deleteTrip(data.id, data.userId);
      return { success: true, message: 'Trip deleted successfully' };
    } catch (error: any) {
      this.logger.error(`gRPC DeleteTrip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'AddItineraryItem')
  async addItineraryItem(@Payload() data: { tripId: string; userId: string; day: number } & AddItineraryItemDto) {
    try {
      const { tripId, userId, day, ...dto } = data;
      const result = await this.tripService.addItineraryItem(tripId, day, dto, userId);
      return { success: true, message: 'Itinerary item added', day: result };
    } catch (error: any) {
      this.logger.error(`gRPC AddItineraryItem error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'RemoveItineraryItem')
  async removeItineraryItem(@Payload() data: { tripId: string; userId: string; activityId: string; day: number }) {
    try {
      await this.tripService.removeItineraryItem(data.tripId, data.activityId, data.day, data.userId);
      return { success: true, message: 'Itinerary item removed' };
    } catch (error: any) {
      this.logger.error(`gRPC RemoveItineraryItem error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'AddBucketItem')
  async addBucketItem(@Payload() data: { tripId: string; userId: string; name: string; description: string; photoUrl?: string; address?: string }) {
    try {
      const { tripId, userId, name, description, photoUrl, address } = data;
      const result = await this.tripService.addBucketItem(tripId, name, description, userId, photoUrl, address);
      return { success: true, message: 'Bucket item added', item: result };
    } catch (error: any) {
      this.logger.error(`gRPC AddBucketItem error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'RemoveBucketItem')
  async removeBucketItem(@Payload() data: { tripId: string; userId: string; itemId: string }) {
    try {
      await this.tripService.removeBucketItem(data.tripId, data.itemId, data.userId);
      return { success: true, message: 'Bucket item removed' };
    } catch (error: any) {
      this.logger.error(`gRPC RemoveBucketItem error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'ShareTrip')
  async shareTrip(@Payload() data: { tripId: string; userId: string }) {
    try {
      const token = await this.tripService.shareTrip(data.tripId, data.userId);
      return { success: true, message: 'Trip shared', shareToken: token };
    } catch (error: any) {
      this.logger.error(`gRPC ShareTrip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  // Updated gRPC Controller - Adjust payloads for AddNote, AddChecklistItem, UpdateChecklistItem
  @GrpcMethod('ItinerariesService', 'AddNote')
  async addNote(@Payload() data: { tripId: string; userId: string; activityId: string; title: string; content: string }) {
    try {
      console.log(data)
      const result = await this.tripService.addNote(data.tripId, data.activityId, data.title, data.content, data.userId);
      return { success: true, message: 'Note added', note: result };
    } catch (error: any) {
      this.logger.error(`gRPC AddNote error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'AddChecklistItem')
  async addChecklistItem(@Payload() data: { tripId: string; userId: string; activityId: string; title: string; texts: any }) {
    try {
      console.log(data)
      const result = await this.tripService.addChecklistItem(data.tripId, data.activityId, data.title, data.texts, data.userId);
      return { success: true, message: 'Checklist item added', checklist: result };
    } catch (error: any) {
      this.logger.error(`gRPC AddChecklistItem error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'UpdateChecklistItem')
  async updateChecklistItem(@Payload() data: { tripId: string; userId: string; activityId: string; checklistTitle: string; itemId: string; completed: boolean }) {
    try {
      console.log(data)
      await this.tripService.updateChecklistItem(data.tripId, data.activityId, data.checklistTitle, data.itemId, data.completed, data.userId);
      return { success: true, message: 'Checklist item updated' };
    } catch (error: any) {
      this.logger.error(`gRPC UpdateChecklistItem error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  // @GrpcMethod('ItinerariesService', 'AddNote')
  // async addNote(@Payload() data: { tripId: string; userId: string; day: number; content: string }) {
  //   try {
  //     const result = await this.tripService.addNote(data.tripId, data.day, data.content, data.userId);
  //     return { success: true, message: 'Note added', note: result };
  //   } catch (error: any) {
  //     this.logger.error(`gRPC AddNote error: ${error.message}`, error.stack);
  //     throw new RpcException({
  //       code: error instanceof BadRequestException ? 3 : 2,
  //       message: error.message,
  //     });
  //   }
  // }

  // @GrpcMethod('ItinerariesService', 'AddChecklistItem')
  // async addChecklistItem(@Payload() data: { tripId: string; userId: string; day: number; text: string }) {
  //   try {
  //     const result = await this.tripService.addChecklistItem(data.tripId, data.day, data.text, data.userId);
  //     return { success: true, message: 'Checklist item added', checklist: result };
  //   } catch (error: any) {
  //     this.logger.error(`gRPC AddChecklistItem error: ${error.message}`, error.stack);
  //     throw new RpcException({
  //       code: error instanceof BadRequestException ? 3 : 2,
  //       message: error.message,
  //     });
  //   }
  // }

  // @GrpcMethod('ItinerariesService', 'UpdateChecklistItem')
  // async updateChecklistItem(@Payload() data: { tripId: string; userId: string; day: number; itemId: string; completed: boolean }) {
  //   try {
  //     await this.tripService.updateChecklistItem(data.tripId, data.day, data.itemId, data.completed, data.userId);
  //     return { success: true, message: 'Checklist item updated' };
  //   } catch (error: any) {
  //     this.logger.error(`gRPC UpdateChecklistItem error: ${error.message}`, error.stack);
  //     throw new RpcException({
  //       code: error instanceof BadRequestException ? 3 : 2,
  //       message: error.message,
  //     });
  //   }
  // }

  @GrpcMethod('ItinerariesService', 'OptimizeDay')
  async optimizeDay(@Payload() data: { tripId: string; userId: string; day: number }) {
    try {
      const { tripId, userId, day } = data;
      console.log('Received optimizeDay request for tripId:', tripId, 'day:', day);
      const result = await this.tripService.optimizeDayRoute(tripId, day, userId);
      return { success: true, message: 'Day route optimized successfully', day: result };
    } catch (error: any) {
      this.logger.error(`gRPC OptimizeDay error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'MoveBucketToItinerary')
  async moveBucketToItinerary(@Payload() data: { tripId: string; userId: string; itemId: string; day: number; activityType?: string }) {
    try {
      const { tripId, userId, itemId, day, activityType } = data;
      const result = await this.tripService.moveBucketToItinerary(tripId, itemId, day, userId, activityType);
      return { success: true, message: 'Move successfully', activity: result };
    } catch (error: any) {
      this.logger.error(`gRPC MoveBucketToItinerary error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'AutoFillLocation')
  async autoFillLocation(@Payload() data: { tripId: string; userId: string; day: number; activityId: string; query: string }) {
    try {
      const { tripId, userId, day, activityId, query } = data;
      const result = await this.tripService.autoFillLocation(tripId, day, activityId, query, userId);
      return { success: true, message: 'Autofill successfully', location: result };
    } catch (error: any) {
      this.logger.error(`gRPC AutoFillLocation error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'SearchLocations')
  async searchLocations(@Payload() data: { tripId: string; userId: string } & SearchLocationsDto) {
    try {
      const { tripId, userId, query, limit } = data;
      const result = await this.tripService.searchLocations(tripId, userId, query, limit);
      return { success: true, suggestions: result };
    } catch (error: any) {
      this.logger.error(`gRPC SearchLocations error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }
}