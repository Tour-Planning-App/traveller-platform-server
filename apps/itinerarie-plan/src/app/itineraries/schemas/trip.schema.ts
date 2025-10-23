// Updated schemas/itineraries.schema.ts (already provided in previous response, no changes needed)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Activity extends Document {
  @Prop({ type: String, enum: ['place', 'stay', 'food', 'activity'] })
  type: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ min: 0, max: 5 })
  rating: number;

  @Prop()
  location: string;

  @Prop()
  time: Date; // Start time

  @Prop()
  photoUrl: string;

  @Prop()
  placeId: string;

  @Prop({ type: [{ 
    content: { type: String, required: true }, 
    createdAt: { type: Date, default: Date.now } 
  }], default: [] })
  notes: { content: string; createdAt: Date }[];

  @Prop({ type: [{ 
      id: { type: Types.ObjectId, auto: true }, 
      text: { type: String, required: true }, 
      completed: { type: Boolean, default: false } 
    }] })
  checklist: { id: Types.ObjectId; text: string; completed: boolean }[];
}

@Schema()
export class ItineraryDay extends Document {
  @Prop({ required: true })
  day: number;

  @Prop({ required: true })
  date: string; // ISO

  @Prop()
  name: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Activity' }] })
  activities: Types.ObjectId[];
}

@Schema()
export class BucketItem extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  confirmed: boolean;

  @Prop()
  photoUrl: string;

  @Prop()
  address: string;
}

@Schema({ timestamps: true })
export class Trip extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  destination: string;

  @Prop({ type: [String] })
  dates: string[]; // ISO strings

  @Prop({ default: 0 })
  budget: number;

  @Prop({ type: [ItineraryDay] })
  itinerary: ItineraryDay[];

  @Prop({ type: [BucketItem] })
  bucketList: BucketItem[];

  @Prop({ default: false })
  isShared: boolean;

  @Prop()
  shareToken: string;
}

export interface LocationSuggestion {
  name: string;
  description: string;
  address: string;
  photoUrl: string;
  rating: number;
  placeId: string;
}

export const TripSchema = SchemaFactory.createForClass(Trip);
export const ActivitySchema = SchemaFactory.createForClass(Activity);
export const ItineraryDaySchema = SchemaFactory.createForClass(ItineraryDay);
export const BucketItemSchema = SchemaFactory.createForClass(BucketItem);