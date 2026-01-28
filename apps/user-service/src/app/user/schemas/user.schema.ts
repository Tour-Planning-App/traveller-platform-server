// Updated user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ unique: true, sparse: true })
  email?: string;

  @Prop({ unique: true, sparse: true })
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
  profileImage?: string;

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

  @Prop()
  bio?: string;

  // Personal Details Fields
  @Prop()
  residentialAddress?: string;

  @Prop()
  emergencyContactName?: string;

  @Prop()
  emergencyContactNumber?: string;

  @Prop()
  emergencyContactAddress?: string;

  @Prop()
  bloodType?: string;

  @Prop()
  allergies?: string;

  // Onboarding Survey Fields
  @Prop() // e.g., ['solo', 'friends']
  travelerTypes?: string;

  @Prop({ type: [String] }) // e.g., ['tuk-tuk', 'public-buses']
  transportationPreferences?: string[];

  @Prop({ type: [String] }) // e.g., ['surfing', 'wildlife-safari']
  activityPreferences?: string[];

  @Prop({ type: [String] }) // e.g., ['lankan-cuisines', 'western-cuisines']
  foodDrinkPreferences?: string[];

  @Prop({ type: [String] }) // e.g., ['misty-highlands', 'beaches']
  sriLankaVibes?: string[];

  @Prop({ type: String }) // e.g., 'misty-highlands'
  other?: string;

  // Account Settings Fields
  @Prop({ default: false })
  twoFactorEnabled?: boolean;

  @Prop({ type: Object, default: { google: false, facebook: false } })
  linkedAccounts?: { google: boolean; facebook: boolean };

  @Prop({ default: true })
  profileVisibility?: boolean;

  // Subscription fields
  @Prop({ required: false })
  stripeCustomerId?: string; // Stripe customer ID

  @Prop({ required: false })
  subscriptionId?: string; // Stripe subscription ID

  @Prop({ enum: ['free', 'basic', 'premium'], default: 'free' })
  plan: string;

  @Prop({ default: false })
  isSubscribed: boolean;

  @Prop({ type: Date })
  subscriptionEndDate?: Date; // For trial/expiration

  @Prop({ default: false })
  isDeactivated?: boolean;

  // ============ SERVICE PROVIDER FIELDS ============
  @Prop()
  businessName?: string; // e.g., "Saman's Cooking Class"

  @Prop()
  businessType?: string; // e.g., "cooking_class", "village_tour", "cultural_experience"

  @Prop()
  businessDescription?: string; // About the service

  @Prop({ type: [String] })
  serviceCategories?: string[]; // ["cooking", "traditional_arts", "nature_tours"]

  @Prop({ type: Object })
  location?: {
    address?: string;
    city?: string;
    district?: string;
    coordinates?: { lat: number; lng: number };
  };

  @Prop()
  contactPhone?: string;

  @Prop()
  whatsappNumber?: string;

  @Prop({ type: [String] })
  languages?: string[]; // Languages provider speaks

  @Prop()
  priceRange?: string; // "budget", "mid-range", "premium"

  @Prop({ default: false })
  isVerified?: boolean; // Admin verification status

  @Prop({ default: true })
  isActive?: boolean; // Provider can toggle availability

  @Prop({ default: 0 })
  rating?: number; // Average rating from travelers

  @Prop({ default: 0 })
  totalReviews?: number;

  @Prop({ type: [String] })
  portfolioImages?: string[]; // Images of their services

}

export const UserSchema = SchemaFactory.createForClass(User);