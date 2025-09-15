import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { SignInDto, VerifyOtpDto, OnboardingDto, OAuthProfileDto } from './dtos/auth.dto';

@Controller('auth')
export class AuthController {

  constructor(private readonly authService: AuthService) {}

@GrpcMethod('AuthService', 'SignIn')
  async signIn(data: SignInDto) {
    return this.authService.signIn(data);
  }

  @GrpcMethod('AuthService', 'VerifyOtp')
  async verifyOtp(data: VerifyOtpDto) {
    return this.authService.verifyOtp(data);
  }

  @GrpcMethod('AuthService', 'CompleteOnboarding')
  async completeOnboarding(data: { userId: string } & OnboardingDto) {
    return this.authService.completeOnboarding(data.userId, data);
  }

  @GrpcMethod('AuthService', 'OAuthSignIn')
  async oAuthSignIn(data: OAuthProfileDto) {
    return this.authService.oAuthSignIn(data);
  }

  // @GrpcMethod('AuthService', 'Login')
  // async login(data: { email: string; password: string }) {
  //   const token = await this.authService.login(data.email, data.password);
  //   return { token };
  // }
}
