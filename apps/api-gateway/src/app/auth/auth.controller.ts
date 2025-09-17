import { Body, Controller, HttpException, HttpStatus, Inject, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { ApiBadRequestResponse, ApiBearerAuth, ApiInternalServerErrorResponse, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { catchError, firstValueFrom } from 'rxjs';
// import { SignInUserDto } from './dtos/signin-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import { SignInDto, VerifyOtpDto, OAuthProfileDto, AuthResponseDto, FullOnboardingDto, OnboardingDto } from './dtos/auth.dto';
import type { Request } from 'express';

@Controller('auth')
export class AuthController {
  private authService: any;
  private readonly logger = new Logger(AuthController.name);

  constructor(
    @Inject('AUTH_PACKAGE') private authClient: ClientGrpcProxy,
  ) {
        this.authService = this.authClient.getService('AuthService');

  }

  @Public()
  @Post('sign-in')
  @ApiOperation({ summary: 'Send OTP for sign in (creates user if new)' })
  @ApiResponse({ status: 200, description: 'OTP sent successfully' })
  @ApiBadRequestResponse({ description: 'Invalid email or phone provided' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error while sending OTP' })
  async signIn(@Body() dto: SignInDto) {
    try {
      const result = await firstValueFrom(
        this.authService.SignIn(dto).pipe(
          catchError((error) => {
            this.logger.error(`SignIn error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error while sending OTP', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid email or phone provided', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Failed to send OTP', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error : any) {
      this.logger.error(`SignIn failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Public()
  @Post('verify-otp')
  @ApiOperation({ summary: 'Verify OTP and get JWT' })
  @ApiResponse({ status: 200, description: 'Authentication successful', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid OTP code' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during verification' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    try {
      const result = await firstValueFrom(
        this.authService.VerifyOtp(dto).pipe(
          catchError((error) => {
            //this.logger.error(`VerifyOtp error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during verification', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid OTP code', HttpStatus.BAD_REQUEST);
            } else if (error.details && error.details.includes('Invalid OTP')) {
              throw new HttpException('Invalid OTP code', HttpStatus.UNAUTHORIZED);
            } else {
              throw new HttpException('OTP verification failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error:any) {
      //this.logger.error(`VerifyOtp failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('onboarding')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Complete onboarding survey' })
  @ApiResponse({ status: 200, description: 'Onboarding completed' })
  @ApiBadRequestResponse({ description: 'Invalid onboarding data' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during onboarding' })
  async completeOnboarding(@Body() dto: OnboardingDto, @Req() req: any) {
    try {
      const userId = req?.user?.userId; // Extract from req.user.sub in production
      if (!userId) return { success: false, message: 'User not authenticated' };

      const result = await firstValueFrom(
        this.authService.CompleteOnboarding({ userId, ...dto }).pipe(
          catchError((error) => {
            this.logger.error(`CompleteOnboarding error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during onboarding', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid onboarding data', HttpStatus.BAD_REQUEST);
            } else if (error.details && error.details.includes('User not found')) {
              throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            } else {
              throw new HttpException('Onboarding failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error:any) {
      this.logger.error(`CompleteOnboarding failed: ${error.message}`, error.stack);
      throw error;
    }
  }


  @Public()
  @Post('google')
  @ApiOperation({ summary: 'Sign in with Google' })
  @ApiResponse({ status: 200, description: 'Google sign-in successful', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid Google profile data' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during Google sign-in' })
  async googleSignIn(@Body() dto: OAuthProfileDto) {
    try {
      dto.provider = 'google';
      const result = await firstValueFrom(
        this.authService.OAuthSignIn(dto).pipe(
          catchError((error) => {
            this.logger.error(`GoogleSignIn error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during Google sign-in', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid Google profile data', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Google sign-in failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error:any) {
      this.logger.error(`GoogleSignIn failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Public()
  @Post('facebook')
  @ApiOperation({ summary: 'Sign in with Facebook' })
  @ApiResponse({ status: 200, description: 'Facebook sign-in successful', type: AuthResponseDto })
  @ApiBadRequestResponse({ description: 'Invalid Facebook profile data' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during Facebook sign-in' })
  async facebookSignIn(@Body() dto: OAuthProfileDto) {
    try {
      dto.provider = 'facebook';
      const result = await firstValueFrom(
        this.authService.OAuthSignIn(dto).pipe(
          catchError((error) => {
            this.logger.error(`FacebookSignIn error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during Facebook sign-in', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid Facebook profile data', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Facebook sign-in failed', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error:any) {
      this.logger.error(`FacebookSignIn failed: ${error.message}`, error.stack);
      throw error;
    }
  }

}
