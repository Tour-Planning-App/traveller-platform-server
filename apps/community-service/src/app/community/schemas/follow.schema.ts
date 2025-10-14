// schemas/follow.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Follow extends Document {
  @Prop({ required: true })
  follower_id: Types.ObjectId;

  @Prop({ required: true })
  followee_id: Types.ObjectId;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);