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
  async addItineraryItem(@Payload() data: { trip_id: string; userId: string; day: number } & AddItineraryItemDto) {
    try {
      const { trip_id, userId, day, ...dto } = data;
      const result = await this.tripService.addItineraryItem(trip_id, day, dto, userId);
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
  async removeItineraryItem(@Payload() data: { trip_id: string; userId: string; activity_id: string; day: number }) {
    try {
      await this.tripService.removeItineraryItem(data.trip_id, data.activity_id, data.day, data.userId);
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
  async addBucketItem(@Payload() data: { trip_id: string; userId: string; name: string; description: string }) {
    try {
      const result = await this.tripService.addBucketItem(data.trip_id, data.name, data.description, data.userId);
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
  async removeBucketItem(@Payload() data: { trip_id: string; userId: string; item_id: string }) {
    try {
      await this.tripService.removeBucketItem(data.trip_id, data.item_id, data.userId);
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
  async shareTrip(@Payload() data: { trip_id: string; userId: string }) {
    try {
      const token = await this.tripService.shareTrip(data.trip_id, data.userId);
      return { success: true, message: 'Trip shared', share_token: token };
    } catch (error: any) {
      this.logger.error(`gRPC ShareTrip error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2,
        message: error.message,
      });
    }
  }

  @GrpcMethod('ItinerariesService', 'AddNote')
  async addNote(@Payload() data: { trip_id: string; userId: string; day: number; content: string }) {
    try {
      const result = await this.tripService.addNote(data.trip_id, data.day, data.content, data.userId);
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
  async addChecklistItem(@Payload() data: { trip_id: string; userId: string; day: number; text: string }) {
    try {
      const result = await this.tripService.addChecklistItem(data.trip_id, data.day, data.text, data.userId);
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
  async updateChecklistItem(@Payload() data: { trip_id: string; userId: string; day: number; item_id: string; completed: boolean }) {
    try {
      await this.tripService.updateChecklistItem(data.trip_id, data.day, data.item_id, data.completed, data.userId);
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
