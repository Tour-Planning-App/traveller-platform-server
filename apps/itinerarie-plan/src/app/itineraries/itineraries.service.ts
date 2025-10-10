import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { Trip } from './schemas/trip.schema';
import { CreateTripDto, UpdateTripDto, AddItineraryItemDto } from './dtos/trip.dto';

@Injectable()
export class ItinerariesService {
  constructor(
    @InjectModel(Trip.name) private tripModel: Model<Trip>,
  ) {}

  async createTrip(userId: string, createDto: CreateTripDto): Promise<Trip> {
    try {
      console.log('Creating trip for user:', userId, createDto);
      // Validation
      if (!userId || !isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!createDto.name || !createDto.destination) {
        throw new BadRequestException('Trip name and destination are required');
      }
      if (!createDto.dates || createDto.dates.length === 0) {
        throw new BadRequestException('At least one date is required');
      }
      if (createDto.budget && createDto.budget < 0) {
        throw new BadRequestException('Budget must be non-negative');
      }

      // Gate: Requires basic+ subscription (uncomment if SubscriptionService exists)
      // const hasAccess = await this.subscriptionService.checkAccess(userId, 'create_trip', 1);
      // if (!hasAccess) throw new ForbiddenException('Subscription required to create trips');

      const trip = new this.tripModel({ userId, ...createDto });
      return await trip.save();
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create trip: ${error.message}`);
    }
  }

  async updateTrip(id: string, updateDto: UpdateTripDto, userId: string): Promise<Trip> {
    try {
      // Validation
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (updateDto.dates && (!updateDto.dates || updateDto.dates.length === 0)) {
        throw new BadRequestException('Dates array cannot be empty');
      }
      if (updateDto.budget !== undefined && updateDto.budget < 0) {
        throw new BadRequestException('Budget must be non-negative');
      }

      const trip = await this.tripModel.findOne({ _id: id, userId });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      Object.assign(trip, updateDto);
      trip.updatedAt = new Date();
      return await trip.save();
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update trip: ${error.message}`);
    }
  }

  async getTrip(id: string): Promise<Trip> {
    try {
      // Validation
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid trip ID');
      }

      const trip = await this.tripModel.findById(id).populate('itinerary.activities').exec();
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }
      return trip;
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch trip: ${error.message}`);
    }
  }

  async getUserTrips(userId: string): Promise<Trip[]> {
    try {
      // Validation
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      return await this.tripModel.find({ userId }).sort('-createdAt').exec();
    } catch (error: any) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(`Failed to fetch user trips: ${error.message}`);
    }
  }

  async deleteTrip(id: string, userId: string): Promise<void> {
    try {
      // Validation
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const result = await this.tripModel.deleteOne({ _id: id, userId });
      if (result.deletedCount === 0) {
        throw new NotFoundException('Trip not found');
      }
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to delete trip: ${error.message}`);
    }
  }

  async addItineraryItem(tripId: string, day: number, activityDto: AddItineraryItemDto, userId: string): Promise<any> {
    try {
      // Validation
      if (!isValidObjectId(tripId)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!Number.isInteger(day) || day < 1) {
        throw new BadRequestException('Day must be a positive integer');
      }
      if (!activityDto.activity || !activityDto.activity.name || !activityDto.activity.type) {
        throw new BadRequestException('Activity name and type are required');
      }
      if (!['place', 'stay', 'food', 'activity'].includes(activityDto.activity.type)) {
        throw new BadRequestException('Invalid activity type');
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      // Validate day exists in dates
      if (day > trip.dates.length) {
        throw new BadRequestException('Day exceeds trip dates');
      }

      const activity = new this.activityModel(activityDto.activity);
      await activity.save();

      let itineraryDay = trip.itinerary.find(d => d.day === day);
      if (!itineraryDay) {
        itineraryDay = { day, date: trip.dates[day - 1], activities: [], note: '', checklist: [] };
        trip.itinerary.push(itineraryDay);
      }
      itineraryDay.activities.push(activity._id);
      await trip.save();

      // Populate for response
      await trip.populate('itinerary.activities');

      return trip.itinerary.find(d => d.day === day);
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to add itinerary item: ${error.message}`);
    }
  }

  async removeItineraryItem(tripId: string, activityId: string, day: number, userId: string): Promise<void> {
    try {
      // Validation
      if (!isValidObjectId(tripId)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!isValidObjectId(activityId)) {
        throw new BadRequestException('Invalid activity ID');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!Number.isInteger(day) || day < 1) {
        throw new BadRequestException('Day must be a positive integer');
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      const itineraryDay = trip.itinerary.find(d => d.day === day);
      if (!itineraryDay) {
        throw new NotFoundException('Itinerary day not found');
      }

      const activityIndex = itineraryDay.activities.findIndex(a => a.toString() === activityId);
      if (activityIndex === -1) {
        throw new NotFoundException('Activity not found in itinerary');
      }

      // Remove reference
      itineraryDay.activities.splice(activityIndex, 1);
      await this.activityModel.deleteOne({ _id: activityId });
      await trip.save();
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to remove itinerary item: ${error.message}`);
    }
  }

  async addBucketItem(tripId: string, name: string, description: string, userId: string): Promise<any> {
    try {
      // Validation
      if (!isValidObjectId(tripId)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!name || name.trim().length === 0) {
        throw new BadRequestException('Bucket item name is required');
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      const item = { name: name.trim(), description: description?.trim() || '', confirmed: false };
      trip.bucketList.push(item);
      await trip.save();
      return item;
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to add bucket item: ${error.message}`);
    }
  }

  async removeBucketItem(tripId: string, itemId: string, userId: string): Promise<void> {
    try {
      // Validation
      if (!isValidObjectId(tripId)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!isValidObjectId(itemId)) {
        throw new BadRequestException('Invalid item ID');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      const itemIndex = trip.bucketList.findIndex(item => item._id?.toString() === itemId);
      if (itemIndex === -1) {
        throw new NotFoundException('Bucket item not found');
      }

      trip.bucketList.splice(itemIndex, 1);
      await trip.save();
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to remove bucket item: ${error.message}`);
    }
  }

  async shareTrip(tripId: string, userId: string): Promise<string> {
    try {
      // Validation
      if (!isValidObjectId(tripId)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      trip.isShared = true;
      trip.shareToken = require('crypto').randomBytes(16).toString('hex'); // Secure token
      await trip.save();
      return trip.shareToken;
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to share trip: ${error.message}`);
    }
  }

  async addNote(tripId: string, day: number, content: string, userId: string): Promise<{ content: string }> {
    try {
      // Validation
      if (!isValidObjectId(tripId)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!Number.isInteger(day) || day < 1) {
        throw new BadRequestException('Day must be a positive integer');
      }
      if (!content || content.trim().length === 0) {
        throw new BadRequestException('Note content is required');
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      const itineraryDay = trip.itinerary.find(d => d.day === day);
      if (!itineraryDay) {
        throw new BadRequestException('Day not found in itinerary');
      }

      itineraryDay.note = content.trim();
      await trip.save();
      return { content: itineraryDay.note };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to add note: ${error.message}`);
    }
  }

  async addChecklistItem(tripId: string, day: number, text: string, userId: string): Promise<{ items: any[] }> {
    try {
      // Validation
      if (!isValidObjectId(tripId)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!Number.isInteger(day) || day < 1) {
        throw new BadRequestException('Day must be a positive integer');
      }
      if (!text || text.trim().length === 0) {
        throw new BadRequestException('Checklist item text is required');
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      const itineraryDay = trip.itinerary.find(d => d.day === day);
      if (!itineraryDay) {
        throw new BadRequestException('Day not found in itinerary');
      }

      if (!itineraryDay.checklist) {
        itineraryDay.checklist = [];
      }
      itineraryDay.checklist.push({ text: text.trim(), completed: false });
      await trip.save();
      return { items: itineraryDay.checklist };
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to add checklist item: ${error.message}`);
    }
  }

  async updateChecklistItem(tripId: string, day: number, itemId: string, completed: boolean, userId: string): Promise<void> {
    try {
      // Validation
      if (!isValidObjectId(tripId)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!isValidObjectId(itemId)) {
        throw new BadRequestException('Invalid item ID');
      }
      if (!isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!Number.isInteger(day) || day < 1) {
        throw new BadRequestException('Day must be a positive integer');
      }
      if (typeof completed !== 'boolean') {
        throw new BadRequestException('Completed must be a boolean');
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      const itineraryDay = trip.itinerary.find(d => d.day === day);
      if (!itineraryDay) {
        throw new BadRequestException('Day not found in itinerary');
      }

      const item = itineraryDay.checklist?.find(i => i._id?.toString() === itemId);
      if (!item) {
        throw new BadRequestException('Checklist item not found');
      }

      item.completed = completed;
      await trip.save();
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update checklist item: ${error.message}`);
    }
  }
}