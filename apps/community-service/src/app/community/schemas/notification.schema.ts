// schemas/notification.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({ required: true })
  user_id: Types.ObjectId;

  @Prop()
  type: string; // 'like', 'comment', 'follow', 'budget_exceeded'

  @Prop()
  title: string;

  @Prop()
  message: string;

  @Prop({ default: false })
  is_read: boolean;

  @Prop()
  related_id: string; // post_id or user_id
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);