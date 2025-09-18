import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Recommendation extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true, type: [String] })
  recommendations: string[];

  @Prop({ required: true })
  description: string;

  @Prop({ type: Object })
  details: any;

  @Prop({ default: false })
  viewed: boolean;
}

export type RecommendationDocument = Recommendation & Document;
export const RecommendationSchema = SchemaFactory.createForClass(Recommendation);