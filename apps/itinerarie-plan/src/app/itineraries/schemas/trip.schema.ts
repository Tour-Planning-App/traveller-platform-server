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

  @Prop()
  note: string;

  @Prop({ type: [{ text: String, completed: { type: Boolean, default: false } }] })
  checklist: { text: string; completed: boolean }[];
}

@Schema()
export class BucketItem extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ default: false })
  confirmed: boolean;
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

export const TripSchema = SchemaFactory.createForClass(Trip);
export const ActivitySchema = SchemaFactory.createForClass(Activity);
export const ItineraryDaySchema = SchemaFactory.createForClass(ItineraryDay);
export const BucketItemSchema = SchemaFactory.createForClass(BucketItem);