import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ unique: true })
  email?: string;

  @Prop({ unique: true })
  phone?: string;

  @Prop({ unique: true, sparse: true }) // sparse: true allows null values without duplicate errors
  googleId?: string;

  @Prop({ unique: true, sparse: true }) // sparse: true allows null values without duplicate errors
  facebookId?: string;

  @Prop()
  name?: string;

  @Prop()
  gender?: string;

  @Prop()
  preferredLanguage?: string;

  @Prop()
  preferredCurrency?: string;

  @Prop()
  password?: string; // Hashed, optional for social/email auth

  @Prop({ default: 'user' })
  role!: string;

  @Prop({ default: false })
  isOnboarded!: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);