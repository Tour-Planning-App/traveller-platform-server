import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, isValidObjectId } from 'mongoose';
import { Activity, Trip, LocationSuggestion } from './schemas/trip.schema';
import { CreateTripDto, UpdateTripDto, AddItineraryItemDto, CreateAITripDto } from './dtos/trip.dto';
import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { ConfigService } from '@nestjs/config';
import { RoutesClient } from '@googlemaps/routing';
import { Client } from '@googlemaps/google-maps-services-js';

@Injectable()
export class ItinerariesService {
  private routesClient: RoutesClient;
  private placesClient: Client;
  constructor(
    @InjectModel(Trip.name) private tripModel: Model<Trip>,
    @InjectModel(Activity.name) private activityModel: Model<Activity>,
    private configService: ConfigService, // For API key
  ) {
    this.routesClient = new RoutesClient({
      apiKey: this.configService.get<string>('GOOGLE_MAPS_API_KEY') || '',
    });
    this.placesClient = new Client({});
  }

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
      if (!createDto.dates || createDto.dates.length !== 2) {
        throw new BadRequestException('Exactly two dates are required: start and end date in YYYY-MM-DD format');
      }
      if (createDto.budget && createDto.budget < 0) {
        throw new BadRequestException('Budget must be non-negative');
      }

      // Validate start and end dates are valid ISO date strings (YYYY-MM-DD format)
      const [startDateStr, endDateStr] = createDto.dates;
      const startDate = new Date(startDateStr);
      const endDate = new Date(endDateStr);
      if (isNaN(startDate.getTime()) ) {
        throw new BadRequestException('Start and end dates must be valid ISO date strings (YYYY-MM-DD format)');
      }
      if (startDate > endDate) {
        throw new BadRequestException('Start date must be before or equal to end date');
      }

      // Generate all dates from start to end inclusive
      const dates: string[] = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Gate: Requires basic+ subscription (uncomment if SubscriptionService exists)
      // const hasAccess = await this.subscriptionService.checkAccess(userId, 'create_trip', 1);
      // if (!hasAccess) throw new ForbiddenException('Subscription required to create trips');

      // Automatically generate ItineraryDay objects based on all dates (matching updated ItineraryDay sub-schema - no notes/checklist here)
      const itinerary = dates.map((date, index) => ({
        day: index + 1, // number, required
        date: date, // string (ISO), required
        name: `Day ${index + 1}: ${createDto.destination}`, // string, optional
        activities: [] // array of ObjectId refs to Activity, starts empty (notes/checklist will be in activities)
      }));

      // Initialize bucketList as empty array (matching BucketItem sub-schema)
      const bucketList: any[] = [];

      const tripData = { 
        userId, // required string
        name: createDto.name, // required string
        destination: createDto.destination, // required string
        dates, // array of all string (ISO dates)
        budget: createDto.budget || 0, // number, default 0
        itinerary, // array of ItineraryDay subdocs
        bucketList, // array of BucketItem subdocs, starts empty
        isShared: false, // boolean, default false
        shareToken: undefined // string, optional
      };

      const trip = new this.tripModel(tripData);
      return await trip.save();
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create trip: ${error.message}`);
    }
  }

async createAITrip(userId: string, createDto: CreateAITripDto): Promise<Trip> {
    try {
      console.log('Creating AI trip for user:', userId, createDto);
      // Validation
      if (!userId || !isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!createDto.name || !createDto.destination) {
        throw new BadRequestException('Trip name and destination are required');
      }
      if (createDto.budget && createDto.budget < 0) {
        throw new BadRequestException('Budget must be non-negative');
      }
      if (!createDto.interests || createDto.interests.length === 0) {
        throw new BadRequestException('At least one interest is required');
      }

      // Generate dates if not provided (default 7-day trip, start 30 days from now)
      let dates: string[] = createDto.dates || [];
      if (dates.length === 0) {
        const startDate = new Date(); // Use current date dynamically
        startDate.setDate(startDate.getDate() + 30);
        for (let i = 0; i < 7; i++) {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          dates.push(d.toISOString().split('T')[0]);
        }
      }

      // Validate dates are valid ISO date strings (YYYY-MM-DD format)
      const validDates = dates.filter(date => {
        const dateObj = new Date(date);
        return !isNaN(dateObj.getTime()) && dateObj.toISOString().split('T')[0] === date;
      });
      if (validDates.length !== dates.length) {
        throw new BadRequestException('All dates must be valid ISO date strings (YYYY-MM-DD format)');
      }

      const numDays = dates.length;

      // LLM Prompt for generation
      const promptTemplate = PromptTemplate.fromTemplate(
        `You are a travel expert. Create a detailed {numDays}-day itinerary for a trip to {destination} named "{name}".
        Budget: ${createDto.budget || 'unlimited'} USD.
        Interests: {interests}.
        Special requests: {specialRequests}.

        For each day, suggest 3-5 activities (mix of place, stay, food, activity types).
        Each activity: type (place/stay/food/activity), name, description (1-2 sentences), location, time (HH:MM:SS format).

        Also, suggest 5 bucket list items (name, description).

        Output ONLY valid JSON:
        {
          "itinerary": [
            {
              "day": 1,
              "activities": [
                {
                  "type": "place",
                  "name": "Example Waterfall",
                  "description": "A stunning cascade...",
                  "location": "Ella",
                  "time": "09:00:00"
                }
                // ... more
              ]
            }
            // ... days
          ],
          "bucketList": [
            {
              "name": "Surfing Lesson",
              "description": "Learn to surf on golden sands..."
            }
            // ... 5 items
          ]
        }`
      );

      const prompt = await promptTemplate.format({
        numDays,
        destination: createDto.destination,
        name: createDto.name,
        interests: createDto.interests.join(', '),
        specialRequests: createDto.specialRequests || 'None'
      });

      // Invoke LLM (assume OPENAI_API_KEY in env)
      const model = new ChatOpenAI({
        openAIApiKey: process.env.OPENAI_API_KEY,
        modelName: "gpt-4o-mini", // Cost-effective for planning
        temperature: 0.7
      });
      const llmResponse = await model.invoke(prompt) as any;
      
      // Parse JSON (in production, add error handling/JSON mode)
      let plan;
      try {
        plan = JSON.parse(llmResponse.content);
      } catch {
        throw new BadRequestException('Failed to parse AI plan');
      }

      // Automatically generate ItineraryDay objects based on dates (matching updated ItineraryDay sub-schema - no notes/checklist here)
      const itinerary = dates.map((date, index) => ({
        day: index + 1, // number, required
        date: date, // string (ISO), required
        name: `Day ${index + 1}: ${createDto.destination}`, // string, optional
        activities: [] // array of ObjectId refs to Activity, starts empty (notes/checklist will be in activities)
      }));

      // Initialize bucketList as empty array (matching BucketItem sub-schema)
      const bucketList: any[] = [];

      // Create base trip with generated itinerary skeleton
      const tripData = { 
        userId, // required string
        name: createDto.name, // required string
        destination: createDto.destination, // required string
        dates, // array of string (ISO dates)
        budget: createDto.budget || 0, // number, default 0
        itinerary, // array of ItineraryDay subdocs
        bucketList, // array of BucketItem subdocs, starts empty
        isShared: false, // boolean, default false
        shareToken: undefined // string, optional
      };

      const trip = new this.tripModel(tripData);
      await trip.save();

      // Add bucket list items
      for (const itemData of plan.bucketList.slice(0, 5)) { // Limit to 5
        await this.addBucketItem(trip._id.toString(), itemData.name, itemData.description || '', userId);
      }

      // Add itinerary items
      for (const dayData of plan.itinerary) {
        const day = dayData.day;
        if (day < 1 || day > numDays) continue;
        for (const actData of dayData.activities) {
          const activityDto: AddItineraryItemDto = {
            activity: {
              type: actData.type,
              name: actData.name,
              description: actData.description || '',
              rating: Math.floor(Math.random() * 5) + 1, // AI could provide, but mock
              location: actData.location || '',
              time: actData.time, // string, converted later
              checklists: undefined,
              notes: undefined
            }
          };
          await this.addItineraryItem(trip._id.toString(), day, activityDto, userId);
        }
      }

      // Populate for full response
      await trip.populate('itinerary.activities');
      return trip;
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new BadRequestException(`Failed to create AI trip: ${error.message}`);
    }
  }

  async updateTrip(id: string, updateDto: UpdateTripDto, userId: string): Promise<Trip> {
    try {
      // Validation
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!userId || !isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (updateDto.dates && (!updateDto.dates || updateDto.dates.length === 0)) {
        throw new BadRequestException('Dates array cannot be empty');
      }
      if (updateDto.budget !== undefined && updateDto.budget < 0) {
        throw new BadRequestException('Budget must be non-negative');
      }

      const trip = await this.tripModel.findOne({ _id: id, userId }) as any;
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

  async getTrip(id: string): Promise<any> {
    try {
      // Validation
      if (!isValidObjectId(id)) {
        throw new BadRequestException('Invalid trip ID');
      }

      const trip = await this.tripModel.findById(id).populate('itinerary.activities').exec();
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }
      console.log(trip)

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
      if (!userId || !isValidObjectId(userId)) {
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
      if (!userId || !isValidObjectId(userId)) {
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
      if (!userId || !isValidObjectId(userId)) {
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

      if (activityDto.activity.time) {
        try {
          // Assume ISO time string like '09:00:00' → full ISO Date for today (time only)
          const timeDate = new Date(`2025-01-01T${activityDto.activity.time}`); // Arbitrary date, time preserved
          activityDto.activity.time = timeDate.toISOString();
        } catch {
          throw new BadRequestException('Invalid time format');
        }
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      // Validate day exists in dates
      if (day > trip.dates.length) {
        throw new BadRequestException('Day exceeds trip dates');
      }

      const activityData = activityDto.activity;
      activityData.photoUrl = activityData.photoUrl || '';
      activityData.placeId = activityData.placeId || '';
      // Notes and checklists start empty in new Activity
      activityData.notes = [];
      activityData.checklists = [];
      const activity = new this.activityModel(activityData);
      await activity.save();

      let itineraryDay = trip.itinerary.find(d => d.day === day) as any;
      if (!itineraryDay) {
        itineraryDay = { day, date: trip.dates[day - 1], activities: [], name: `Day ${day}: ${trip.destination}` };
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
      if (!userId || !isValidObjectId(userId)) {
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

  async addBucketItem(tripId: string, name: string, description: string, userId: string, photoUrl?: string, address?: string): Promise<any> {
    try {
      // Validation
      if (!isValidObjectId(tripId)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!userId || !isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!name || name.trim().length === 0) {
        throw new BadRequestException('Bucket item name is required');
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId });
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      const item = { 
        name: name.trim(), 
        description: description?.trim() || '', 
        confirmed: false,
        photoUrl: photoUrl || '',
        address: address || ''
      } as any;
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
      if (!userId || !isValidObjectId(userId)) {
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
      if (!userId || !isValidObjectId(userId)) {
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

  async addNote(tripId: string, activityId: string, title: string, content: string, userId: string): Promise<{ title: string; content: string; createdAt: Date }> {
    try {
      // Validation
      if (!isValidObjectId(tripId)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!isValidObjectId(activityId)) {
        throw new BadRequestException('Invalid activity ID');
      }
      if (!userId || !isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!title || !content || title.trim().length === 0 || content.trim().length === 0) {
        throw new BadRequestException('Note title and content are required');
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId }).populate('itinerary.activities');
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      // Find the activity across all days
      let activity: any = null;
      for (const day of trip.itinerary) {
        activity = day.activities.find((act: any) => act._id.toString() === activityId);
        if (activity) break;
      }
      if (!activity) {
        throw new NotFoundException('Activity not found');
      }

      const newNote = { 
        title: title.trim(), 
        content: content.trim(), 
        createdAt: new Date() 
      };
      activity.notes.push(newNote);
      await activity.save();
      await trip.save(); // Save trip to update references if needed
      return newNote;
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to add note: ${error.message}`);
    }
  }

async addChecklistItem(tripId: string, activityId: string, checklistTitle: string, texts: any, userId: string): Promise<{ id: Types.ObjectId; title: string; items: { id: Types.ObjectId; text: string; completed: boolean }[] }> {
  try {
    console.log(texts)
    console.log(tripId)
    console.log(activityId)
    console.log(checklistTitle)
    console.log(userId)
    // Validation
    if (!isValidObjectId(tripId)) {
      throw new BadRequestException('Invalid trip ID');
    }
    if (!isValidObjectId(activityId)) {
      throw new BadRequestException('Invalid activity ID');
    }
    if (!userId || !isValidObjectId(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!checklistTitle || checklistTitle.trim().length === 0) {
      throw new BadRequestException('Checklist title is required');
    }
    if (!texts || texts.length === 0 || texts.some(t => !t || t.trim().length === 0)) {
      throw new BadRequestException('At least one valid checklist item text is required');
    }

    const trip = await this.tripModel.findOne({ _id: tripId, userId }).populate('itinerary.activities');
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    // Find the activity across all days
    let activity: any = null;
    for (const day of trip.itinerary) {
      activity = day.activities.find((act: any) => act._id.toString() === activityId);
      if (activity) break;
    }
    if (!activity) {
      throw new NotFoundException('Activity not found');
    }

    const trimmedTitle = checklistTitle.trim();
    // Check if checklist with this title already exists
    let existingChecklistIndex = activity.checklists.findIndex((cl: any) => cl.title === trimmedTitle);
    if (existingChecklistIndex !== -1) {
      // Append to existing checklist
      const existingChecklist = activity.checklists[existingChecklistIndex];
      texts.forEach(text => {
        if (text.trim()) {
          const newItem = { 
            text: text.trim(), 
            completed: false 
          };
          existingChecklist.items.push(newItem);
        }
      });
    } else {
      // Create new checklist with multiple items
      const newChecklistItems = texts
        .filter(text => text.trim())
        .map(text => ({ 
          text: text.trim(), 
          completed: false 
        }));
      const newChecklist = { 
        title: trimmedTitle,
        items: newChecklistItems
      };
      activity.checklists.push(newChecklist);
    }
    await activity.save();
    await trip.save(); // Save trip to update references if needed
    
    // Return the updated checklist
    const updatedChecklist = activity.checklists.find((cl: any) => cl.title === trimmedTitle);
    return updatedChecklist;
  } catch (error: any) {
    if (error instanceof BadRequestException || error instanceof NotFoundException) {
      throw error;
    }
    throw new BadRequestException(`Failed to add checklist items: ${error.message}`);
  }
}

  async updateChecklistItem(tripId: string, activityId: string, checklistTitle: string, itemId: string, completed: boolean, userId: string): Promise<void> {
    try {
      // Validation
      if (!isValidObjectId(tripId)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!isValidObjectId(activityId)) {
        throw new BadRequestException('Invalid activity ID');
      }
      if (!isValidObjectId(itemId)) {
        throw new BadRequestException('Invalid item ID');
      }
      if (!userId || !isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (typeof completed !== 'boolean') {
        throw new BadRequestException('Completed must be a boolean');
      }
      if (!checklistTitle || checklistTitle.trim().length === 0) {
        throw new BadRequestException('Checklist title is required');
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId }).populate('itinerary.activities');
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      // Find the activity across all days
      let activity: any = null;
      for (const day of trip.itinerary) {
        activity = day.activities.find((act: any) => act._id.toString() === activityId);
        if (activity) break;
      }
      if (!activity) {
        throw new BadRequestException('Activity not found');
      }

      console.log(activity)

      const checklist = activity.checklists?.find(cl => cl.title === checklistTitle.trim());
      if (!checklist) {
        throw new BadRequestException('Checklist not found');
      }

      const item = checklist.items?.find(i => i._id?.toString() === itemId);
      if (!item) {
        throw new BadRequestException('Checklist item not found');
      }

      item.completed = completed;
      await activity.save();
      await trip.save(); // Save trip to update references if needed
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to update checklist item: ${error.message}`);
    }
  }

  async optimizeDayRoute(tripId: string, day: number, userId: string): Promise<any> {
    try {
      // Validation
      if (!isValidObjectId(tripId)) {
        throw new BadRequestException('Invalid trip ID');
      }
      if (!userId || !isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
      if (!Number.isInteger(day) || day < 1) {
        throw new BadRequestException('Day must be a positive integer');
      }

      const trip = await this.tripModel.findOne({ _id: tripId, userId }).populate('itinerary.activities').exec() as any;
      if (!trip) {
        throw new NotFoundException('Trip not found');
      }

      const itineraryDay = trip.itinerary.find(d => d.day === day) as any;
      if (!itineraryDay) {
        throw new NotFoundException('Day not found in itinerary');
      }

      const activities = itineraryDay.activities as Activity[]; // Populated
      if (!activities || activities.length < 2) {
        throw new BadRequestException('Insufficient activities for optimization');
      }

      // Filter activities with locations
      const locationActivities = activities.filter(a => a.location);
      if (locationActivities.length < 2) {
        return itineraryDay; // No optimization needed
      }

      // Find stay (fixed origin/destination)
      const stayActivity = locationActivities.find(a => a.type === 'stay');
      const originIdx = stayActivity ? locationActivities.indexOf(stayActivity) : 0;
      const originLocation = locationActivities[originIdx].location;

      // Prepare intermediates (exclude origin)
      const intermediateOriginalIndices: number[] = [];
      const intermediates: { address: string }[] = [];
      locationActivities.forEach((act, idx) => {
        if (idx !== originIdx) {
          intermediateOriginalIndices.push(idx);
          intermediates.push({ address: act.location });
        }
      });

      if (intermediates.length === 0) {
        return itineraryDay;
      }

      // Call Google Routes API
      const request = {
        origin: { address: originLocation },
        destination: { address: originLocation },
        intermediates,
        travelMode: 'DRIVE' as const,
        optimizeWaypointOrder: true,
        routingPreference: 'TRAFFIC_AWARE' as const,
      };

      const [response] = await this.routesClient.computeRoutes(request);
      if (!response.routes || response.routes.length === 0) {
        throw new BadRequestException('No optimized route found');
      }

      const optIndices = response.routes[0].optimizedIntermediateWaypointIndex || [];
      if (optIndices.length !== intermediateOriginalIndices.length) {
        throw new BadRequestException('Optimization failed');
      }

      // Reorder: origin + optimized intermediates
      const reorderedLocationIndices = [originIdx, ...optIndices.map(idx => intermediateOriginalIndices[idx])];

      // Create new order for all activities (location-based first in opt order, then non-location)
      const nonLocationActivities = activities.filter(a => !a.location);
      const newActivitiesOrder = [
        ...reorderedLocationIndices.map(idx => locationActivities[idx]._id),
        ...nonLocationActivities.map(a => a._id)
      ];

      // Reorder activities array
      itineraryDay.activities = newActivitiesOrder.map(id => 
        activities.find(a => a._id.toString() === id.toString())
      );

      trip.updatedAt = new Date();
      await trip.save();

      // Re-populate
      await trip.populate('itinerary.activities');
      return trip.itinerary.find(d => d.day === day) as any;
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Failed to optimize route: ${error.message}`);
    }
  }

  async moveBucketToItinerary(tripId: string, itemId: string, day: number, userId: string, activityType: string = 'activity'): Promise<Activity> {
    // Validation (similar to existing)
    if (!isValidObjectId(tripId)) {
      throw new BadRequestException('Invalid trip ID');
    }
    if (!isValidObjectId(itemId)) {
      throw new BadRequestException('Invalid item ID');
    }
    if (!userId || !isValidObjectId(userId)) {
      throw new BadRequestException('Invalid user ID');
    }
    if (!Number.isInteger(day) || day < 1) {
      throw new BadRequestException('Day must be a positive integer');
    }
    if (!['place', 'stay', 'food', 'activity'].includes(activityType)) {
      throw new BadRequestException('Invalid activity type');
    }

    const trip = await this.tripModel.findOne({ _id: tripId, userId }).populate('bucketList').exec();
    if (!trip) throw new NotFoundException('Trip not found');

    const bucketIndex = trip.bucketList.findIndex(item => item._id.toString() === itemId);
    if (bucketIndex === -1) throw new NotFoundException('Bucket item not found');

    const bucketItem = trip.bucketList[bucketIndex] as any;
    // Create activity from bucket
    const activity = new this.activityModel({
      type: activityType,
      name: bucketItem.name,
      description: bucketItem.description || '',
      location: bucketItem.address || '',
      photoUrl: bucketItem.photoUrl || '',
      placeId: '',
      time: undefined
    });
    await activity.save();

    // Add to day's itinerary (reuse logic)
    let itineraryDay = trip.itinerary.find(d => d.day === day) as any;
    if (!itineraryDay) {
      itineraryDay = { day, date: trip.dates[day - 1], activities: [], note: '', checklist: [] };
      trip.itinerary.push(itineraryDay);
    }
    itineraryDay.activities.push(activity._id);

    // Remove from bucket
    trip.bucketList.splice(bucketIndex, 1);
    await trip.save();

    await trip.populate('itinerary.activities');
    return activity;
  }

  async autoFillLocation(tripId: string, day: number, activityId: string, query: string, userId: string): Promise<string> {
    // Validation
    if (!isValidObjectId(tripId)) {
      throw new BadRequestException('Invalid trip ID');
    }
    if (!isValidObjectId(activityId)) {
      throw new BadRequestException('Invalid activity ID');
    }
      if (!userId || !isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
    if (!Number.isInteger(day) || day < 1) {
      throw new BadRequestException('Day must be a positive integer');
    }
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query is required');
    }

    const trip = await this.tripModel.findOne({ _id: tripId, userId }).populate('itinerary.activities').exec();
    if (!trip) throw new NotFoundException('Trip not found');

    const itineraryDay = trip.itinerary.find(d => d.day === day) as any;
    if (!itineraryDay) throw new NotFoundException('Day not found');

    const activity = (itineraryDay.activities as Activity[]).find(a => a._id.toString() === activityId) as any;
    if (!activity) throw new NotFoundException('Activity not found');

    // Call Google Places (Text Search)
    const response = await this.placesClient.textSearch({
      params: {
        query: `${query} near ${trip.destination}`,  // Contextualize
        key: this.configService.get<string>('GOOGLE_MAPS_API_KEY')
      }
    });

    if (response.data.results && response.data.results.length > 0) {
      const suggested = response.data.results[0];
      const photoRef = suggested.photos?.[0]?.photo_reference;
      const photoUrl = photoRef ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${this.configService.get<string>('GOOGLE_MAPS_API_KEY')}` : '';
      activity.location = suggested.formatted_address || suggested.name;
      activity.photoUrl = photoUrl;
      activity.placeId = suggested.place_id;
      activity.description = suggested.name; // Simple summary
      await activity.save();
      await trip.save();
      return suggested.formatted_address || suggested.name;
    }
    throw new BadRequestException('No location suggestions found');
  }

  async searchLocations(tripId: string, userId: string, query: string, limit: number = 5): Promise<LocationSuggestion[]> {
    // Validation
    if (!isValidObjectId(tripId)) {
      throw new BadRequestException('Invalid trip ID');
    }
      if (!userId || !isValidObjectId(userId)) {
        throw new BadRequestException('Invalid user ID');
      }
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query is required');
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > 10) {
      throw new BadRequestException('Limit must be between 1 and 10');
    }

    const trip = await this.tripModel.findOne({ _id: tripId, userId });
    if (!trip) throw new NotFoundException('Trip not found');

    // Call Google Places Text Search
    const response = await this.placesClient.textSearch({
      params: {
        query: `${query} in ${trip.destination}`,
        key: this.configService.get<string>('GOOGLE_MAPS_API_KEY')
      }
    });

    if (!response.data.results || response.data.results.length === 0) {
      return [];
    }

    const suggestions: LocationSuggestion[] = [];
    const apiKey = this.configService.get<string>('GOOGLE_MAPS_API_KEY');
    for (const place of response.data.results.slice(0, limit)) {
      const photoRef = place.photos?.[0]?.photo_reference;
      const photoUrl = photoRef ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photoRef}&key=${apiKey}` : '';
      suggestions.push({
        name: place.name,
        description: place.formatted_address || place.name, // Simple summary; could fetch details for better
        address: place.formatted_address || '',
        photoUrl,
        rating: place.rating || 0,
        placeId: place.place_id
      });
    }

    return suggestions;
  }
}