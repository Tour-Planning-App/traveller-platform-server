import { Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload } from '@nestjs/microservices';
import { RpcException } from '@nestjs/microservices';
import { CreateTripDto, UpdateTripDto, AddItineraryItemDto } from './dtos/trip.dto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { ItinerariesService } from './itineraries.service';

@Controller('itineraries')
export class ItinerariesController {
    private readonly logger = new Logger(ItinerariesController.name);

  constructor(private readonly tripService: ItinerariesService) {}

  @GrpcMethod('TripService', 'CreateTrip')
  async createTrip(@Payload() data: { user_id: string } & CreateTripDto) {
    try {
      const { user_id, ...dto } = data;
      const result = await this.tripService.createTrip(user_id, dto);
      return { success: true, message: 'Trip created successfully', trip: result };
    } catch (error: any) {
      this.logger.error(`gRPC CreateTrip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof ForbiddenException ? 7 : (error instanceof BadRequestException ? 3 : 2),
        message: error.message,
      });
    }
  }

  @GrpcMethod('TripService', 'UpdateTrip')
  async updateTrip(@Payload() data: { id: string; user_id: string } & UpdateTripDto) {
    try {
      const { id, user_id, ...dto } = data;
      const result = await this.tripService.updateTrip(id, dto, user_id);
      return { success: true, message: 'Trip updated successfully', trip: result };
    } catch (error: any) {
      this.logger.error(`gRPC UpdateTrip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TripService', 'GetTrip')
  async getTrip(@Payload() data: { id: string }) {
    try {
      const result = await this.tripService.getTrip(data.id);
      return { success: true, trip: result };
    } catch (error: any) {
      this.logger.error(`gRPC GetTrip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TripService', 'GetUserTrips')
  async getUserTrips(@Payload() data: { user_id: string }) {
    try {
      const result = await this.tripService.getUserTrips(data.user_id);
      return { success: true, trips: result };
    } catch (error: any) {
      this.logger.error(`gRPC GetUserTrips error: ${error.message}`, error.stack);
      throw new RpcException({
        code: 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TripService', 'DeleteTrip')
  async deleteTrip(@Payload() data: { id: string; user_id: string }) {
    try {
      await this.tripService.deleteTrip(data.id, data.user_id);
      return { success: true, message: 'Trip deleted successfully' };
    } catch (error: any) {
      this.logger.error(`gRPC DeleteTrip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TripService', 'AddItineraryItem')
  async addItineraryItem(@Payload() data: { trip_id: string; user_id: string; day: number } & AddItineraryItemDto) {
    try {
      const { trip_id, user_id, day, ...dto } = data;
      const result = await this.tripService.addItineraryItem(trip_id, day, dto, user_id);
      return { success: true, message: 'Itinerary item added', day: result };
    } catch (error: any) {
      this.logger.error(`gRPC AddItineraryItem error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TripService', 'RemoveItineraryItem')
  async removeItineraryItem(@Payload() data: { trip_id: string; user_id: string; activity_id: string; day: number }) {
    try {
      await this.tripService.removeItineraryItem(data.trip_id, data.activity_id, data.day, data.user_id);
      return { success: true, message: 'Itinerary item removed' };
    } catch (error: any) {
      this.logger.error(`gRPC RemoveItineraryItem error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TripService', 'AddBucketItem')
  async addBucketItem(@Payload() data: { trip_id: string; user_id: string; name: string; description: string }) {
    try {
      const result = await this.tripService.addBucketItem(data.trip_id, data.name, data.description, data.user_id);
      return { success: true, message: 'Bucket item added', item: result };
    } catch (error: any) {
      this.logger.error(`gRPC AddBucketItem error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TripService', 'RemoveBucketItem')
  async removeBucketItem(@Payload() data: { trip_id: string; user_id: string; item_id: string }) {
    try {
      await this.tripService.removeBucketItem(data.trip_id, data.item_id, data.user_id);
      return { success: true, message: 'Bucket item removed' };
    } catch (error: any) {
      this.logger.error(`gRPC RemoveBucketItem error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TripService', 'ShareTrip')
  async shareTrip(@Payload() data: { trip_id: string; user_id: string }) {
    try {
      const token = await this.tripService.shareTrip(data.trip_id, data.user_id);
      return { success: true, message: 'Trip shared', share_token: token };
    } catch (error: any) {
      this.logger.error(`gRPC ShareTrip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TripService', 'AddNote')
  async addNote(@Payload() data: { trip_id: string; user_id: string; day: number; content: string }) {
    try {
      const result = await this.tripService.addNote(data.trip_id, data.day, data.content, data.user_id);
      return { success: true, message: 'Note added', note: result };
    } catch (error: any) {
      this.logger.error(`gRPC AddNote error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TripService', 'AddChecklistItem')
  async addChecklistItem(@Payload() data: { trip_id: string; user_id: string; day: number; text: string }) {
    try {
      const result = await this.tripService.addChecklistItem(data.trip_id, data.day, data.text, data.user_id);
      return { success: true, message: 'Checklist item added', checklist: result };
    } catch (error: any) {
      this.logger.error(`gRPC AddChecklistItem error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('TripService', 'UpdateChecklistItem')
  async updateChecklistItem(@Payload() data: { trip_id: string; user_id: string; day: number; item_id: string; completed: boolean }) {
    try {
      await this.tripService.updateChecklistItem(data.trip_id, data.day, data.item_id, data.completed, data.user_id);
      return { success: true, message: 'Checklist item updated' };
    } catch (error: any) {
      this.logger.error(`gRPC UpdateChecklistItem error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }
}
