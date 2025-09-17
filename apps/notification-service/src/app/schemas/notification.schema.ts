import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class UserDevice extends Document {
  @Prop({ required: true })
  userId?: string;

  @Prop({ required: true })
  email?: string;

  @Prop({ required: true, type: [String] })
  expoPushToken?: string[];
}

export type UserDeviceDocument = UserDevice & Document;
export const UserDeviceSchema = SchemaFactory.createForClass(UserDevice);

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: false })
  email?: string;

  @Prop({ required: true })
  title?: string;

  @Prop({ required: true })
  content?: string;

  @Prop({ required: true, default: false })
  isGlobal?: boolean;

  @Prop({ required: false })
  userId?: string; // For targeted notifications

  @Prop({ default: Date.now })
  createdAt?: Date;

  @Prop({ default: Date.now })
  updatedAt?: Date;
}

export type NotificationDocument = Notification & Document;
export const NotificationSchema = SchemaFactory.createForClass(Notification);