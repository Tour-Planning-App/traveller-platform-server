// schemas/post.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ required: true })
  user_id: Types.ObjectId;

  @Prop()
  caption: string;

  @Prop()
  image_url: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  likes: Types.ObjectId[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Comment' }] })
  comments: Types.ObjectId[];

  @Prop({ type: [String] })
  tags: string[];

  @Prop({ default: 0 })
  like_count: number;
}

export const PostSchema = SchemaFactory.createForClass(Post);