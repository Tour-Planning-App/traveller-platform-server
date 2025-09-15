import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import * as bcrypt from 'bcrypt';
import { SignInDto, VerifyOtpDto, OnboardingDto, OAuthProfileDto, AuthResponseDto } from './dtos/auth.dto';
import twilio from 'twilio';
// import sgMail from '@twilio/email';

const otpStore = new Map<string, string>(); // In-memory OTP store (use Redis in production)

@Injectable()
export class AuthService {
  private twilioClient: twilio.Twilio;
  // private sgMailClient: sgMail.MailService;

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    // this.sgMailClient = sgMail(process.env.TWILIO_SENDGRID_API_KEY);
  }

  async signIn(dto: SignInDto): Promise<{ success: boolean }> {
    const { email, phone } = dto;
    const identifier = email || phone;
    if (!identifier) throw new UnauthorizedException('Email or phone required');

    const existingUser = await this.userModel.findOne({ email, phone });
    const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    otpStore.set(identifier, code);

    if (email) {
      // Send OTP via email using Twilio SendGrid
      // await this.sgMailClient.send({
      //   to: email,
      //   from: 'no-reply@yourdomain.com', // Replace with verified SendGrid sender
      //   subject: 'Your OTP Code',
      //   text: `Your OTP code is ${code}. It is valid for 10 minutes.`,
      // });
    } else if (phone) {
      // Send OTP via SMS using Twilio
      await this.twilioClient.messages.create({
        body: `Your OTP code is ${code}. It is valid for 10 minutes.`,
        from: process.env.TWILIO_PHONE_NUMBER, // Verified Twilio number
        to: phone,
      });
    }

    return { success: true };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponseDto> {
    const { email, phone, code } = dto;
    const identifier = email || phone;
    if (!identifier) throw new UnauthorizedException('Email or phone required');

    const storedCode = otpStore.get(identifier);
    if (code !== storedCode) throw new UnauthorizedException('Invalid OTP');

    let user = await this.userModel.findOne({ email, phone });
    const isNewUser = !user;
    if (isNewUser) {
      user = new this.userModel({ 
        email, 
        phone, 
        role: 'user', 
        isOnboarded: false 
      });
      await user.save();
    }

    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    otpStore.delete(identifier); // Clear OTP
    return { accessToken, isNewUser, isOnboarded: user.isOnboarded };
  }

  async completeOnboarding(userId: string, dto: OnboardingDto): Promise<User> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { ...dto, isOnboarded: true },
      { new: true }
    );
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }


  async oAuthSignIn(profile: OAuthProfileDto): Promise<AuthResponseDto> {
    let user = await this.userModel.findOne({ [profile.provider === 'google' ? 'googleId' : 'facebookId']: profile.providerId });
    const isNewUser = !user;
    if (isNewUser) {
      user = new this.userModel({ 
        email: profile.email, 
        name: profile.name,
        [profile.provider === 'google' ? 'googleId' : 'facebookId']: profile.providerId,
        role: 'user', 
        isOnboarded: false 
      });
      await user.save();
    }

    const payload = { sub: user._id.toString(), email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);
    return { accessToken, isNewUser, isOnboarded: user.isOnboarded };
  }


}
