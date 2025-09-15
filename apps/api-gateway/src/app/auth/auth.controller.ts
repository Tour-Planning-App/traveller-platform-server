import { Body, Controller, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { firstValueFrom } from 'rxjs';
// import { SignInUserDto } from './dtos/signin-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { SignInDto, VerifyOtpDto, OnboardingDto, OAuthProfileDto, AuthResponseDto } from './dtos/auth.dto';


@Controller('auth')
export class AuthController {
  private authService: any;

  constructor(
    @Inject('AUTH_PACKAGE') private authClient: ClientGrpcProxy,
  ) {
        this.authService = this.authClient.getService('AuthService');

  }

  @Public()
  @Post('sign-in')
  @ApiOperation({ summary: 'Send OTP for sign in (creates user if new)' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  async signIn(@Body() dto: SignInDto) {
    const result = await firstValueFrom(this.authService.SignIn(dto));
    return result;
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and get JWT' })
  @ApiResponse({ status: 200, description: 'Authentication successful', type: AuthResponseDto })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const result = await firstValueFrom(this.authService.VerifyOtp(dto));
    return result;
  }

  @Post('onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Complete onboarding survey' })
  @ApiResponse({ status: 200, description: 'Onboarding completed' })
  async completeOnboarding(@Body() dto: OnboardingDto) {
    const userId = 'from-jwt'; // Extract from req.user in real impl
    const result = await firstValueFrom(this.authService.CompleteOnboarding({ userId, ...dto }));
    return result;
  }

  @Public()
  @Post('google')
  @ApiOperation({ summary: 'Sign in with Google' })
  async googleSignIn(@Body() dto: OAuthProfileDto) {
    dto.provider = 'google';
    const result = await firstValueFrom(this.authService.OAuthSignIn(dto));
    return result;
  }

  @Public()
  @Post('facebook')
  @ApiOperation({ summary: 'Sign in with Facebook' })
  async facebookSignIn(@Body() dto: OAuthProfileDto) {
    dto.provider = 'facebook';
    const result = await firstValueFrom(this.authService.OAuthSignIn(dto));
    return result;
  }
}
