import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: ['superadmin', 'admin', 'traveler'], default: 'traveler' })
  role: string;

  @Prop({ required: false })
  preferredLanguage?: string;

  @Prop({ required: false })
  preferredCurrency?: string;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);