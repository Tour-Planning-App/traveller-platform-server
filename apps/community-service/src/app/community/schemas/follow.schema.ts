// schemas/follow.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Follow extends Document {
  @Prop({ required: true })
  followerId: Types.ObjectId;

  @Prop({ required: true })
  followeeId: Types.ObjectId;
}

export const FollowSchema = SchemaFactory.createForClass(Follow);