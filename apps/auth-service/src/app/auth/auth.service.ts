import { BadRequestException, Inject, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { SignInDto, VerifyOtpDto, OnboardingDto, OAuthProfileDto, AuthResponseDto } from './dtos/auth.dto';
import twilio from 'twilio';
import { ClientKafka } from '@nestjs/microservices';
// import sgMail from '@twilio/email';

const otpStore = new Map<string, string>(); // In-memory OTP store (use Redis in production)

@Injectable()
export class AuthService {
  private twilioClient: twilio.Twilio;
  // private sgMailClient: sgMail.MailService;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject('EMAIL_SERVICE') private readonly emailClient: ClientKafka,

    private jwtService: JwtService,
  ) {
    try {
      this.twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      //this.sgMailClient = sgMail(process.env.TWILIO_SENDGRID_API_KEY);
    } catch (error:any) {
      this.logger.error(`Failed to initialize Twilio clients: ${error.message}`);
      throw new InternalServerErrorException('Service initialization failed');
    }
  }

  async signIn(dto: SignInDto): Promise<{ success: boolean }> {
    try {
      const { email, phone } = dto;
      const identifier = email || phone;
      if (!identifier) throw new BadRequestException('Email or phone required');

      // Check if user exists (for logging, not blocking)
      const existingUser = await this.userModel.findOne({ email, phone });
      this.logger.log(`SignIn attempt for ${identifier}, existing user: ${!!existingUser}`);

      const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
      otpStore.set(identifier, code);
      this.logger.debug(`Generated OTP ${code} for ${identifier}`);

      if (email) {
        await this.emailClient.emit('send_verification_code_email', {
          user: { email },
          code,
        }).toPromise();
        this.logger.log(`Email OTP request sent to email-service for ${email}`);
        // Send OTP via email using Twilio SendGrid
        // await this.sgMailClient.send({
        //   to: email,
        //   from: 'no-reply@yourdomain.com', // Replace with verified SendGrid sender
        //   subject: 'Your OTP Code',
        //   text: `Your OTP code is ${code}. It is valid for 10 minutes.`,
        // });
        this.logger.log(`Email OTP sent to ${email}`);
      } else if (phone) {
        // Send OTP via SMS using Twilio
        const message = await this.twilioClient.messages.create({
          body: `Your OTP code is ${code}. It is valid for 10 minutes.`,
          from: process.env.TWILIO_PHONE_NUMBER, // Verified Twilio number
          to: phone,
        });
        this.logger.log(`SMS OTP sent to ${phone}, SID: ${message.sid}`);
      } else {
        throw new BadRequestException('Must provide email or phone');
      }

      return { success: true };
    } catch (error : any) {
      this.logger.error(`SignIn failed for ${dto.email || dto.phone}: ${error.message}`, error.stack);
      if (error.code === 21608) { // Twilio invalid phone number
        throw new BadRequestException('Invalid phone number');
      } else if (error.code === 30007) { // SendGrid invalid email
        throw new BadRequestException('Invalid email address');
      } else if (error.code >= 50000) { // Twilio/SendGrid server error
        throw new InternalServerErrorException('Failed to send OTP due to service error');
      } else {
        throw new InternalServerErrorException('Failed to send OTP');
      }
    }
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<AuthResponseDto> {
    try {
      const { email, phone, code } = dto;
      const identifier = email || phone;
      if (!identifier) throw new BadRequestException('Email or phone required');

      const storedCode = otpStore.get(identifier);
      if (!storedCode) throw new UnauthorizedException('OTP expired or not found');
      if (code !== storedCode) throw new UnauthorizedException('Invalid OTP');

      let user = await this.userModel.findOne({ $or: [{ email }, { phone }] }) as any | null;
      const isNewUser = !user;
      if (isNewUser) {
        user = new this.userModel({ 
          email, 
          phone, 
          role: 'Traveller', 
          isOnboarded: false 
        });
        await user.save();
        this.logger.log(`New user created: ${user._id}`);
      }

      const payload = { sub: user._id.toString(), email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);

      otpStore.delete(identifier); // Clear OTP
      this.logger.log(`OTP verified for ${identifier}, user: ${user._id}`);
      return { accessToken, isNewUser, isOnboarded: user.isOnboarded };
    } catch (error : any) {
      this.logger.error(`VerifyOtp failed for ${dto.email || dto.phone}: ${error.message}`, error.stack);
      if (error instanceof UnauthorizedException || error.message.includes('Invalid OTP')) {
        throw new UnauthorizedException('Invalid OTP');
      } else if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new InternalServerErrorException('OTP verification failed');
      }
    }
  }

  async completeOnboarding(userId: string, dto: OnboardingDto): Promise<User> {
    try {
      const user = await this.userModel.findByIdAndUpdate(
        userId,
        { ...dto, isOnboarded: true },
        { new: true }
      );
      if (!user) throw new BadRequestException('User not found');
      this.logger.log(`Onboarding completed for user: ${userId}`);
      return user;
    } catch (error:any) {
      this.logger.error(`CompleteOnboarding failed for ${userId}: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      } else {
        throw new InternalServerErrorException('Onboarding failed');
      }
    }
  }


  async oAuthSignIn(profile: OAuthProfileDto): Promise<AuthResponseDto> {
    try {
      let user = await this.userModel.findOne({ [profile.provider === 'google' ? 'googleId' : 'facebookId']: profile.providerId }) as any;
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
        this.logger.log(`New OAuth user created: ${user._id} via ${profile.provider}`);
      }

      const payload = { sub: user._id.toString(), email: user.email, role: user.role };
      const accessToken = this.jwtService.sign(payload);
      return { accessToken, isNewUser, isOnboarded: user.isOnboarded };
    } catch (error:any) {
      this.logger.error(`OAuthSignIn failed for ${profile.provider}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('OAuth sign-in failed');
    }
  }

  // async login(email: string, password: string): Promise<string> {
  //   try {
  //     const user = await this.userModel.findOne({ email });
  //     if (!user || !await bcrypt.compare(password, user.password || '')) {
  //       throw new UnauthorizedException('Invalid credentials');
  //     }
  //     const payload = { sub: user._id.toString(), email: user.email, role: user.role };
  //     return this.jwtService.sign(payload);
  //   } catch (error) {
  //     this.logger.error(`Login failed for ${email}: ${error.message}`, error.stack);
  //     throw error;
  //   }
  // }


}
