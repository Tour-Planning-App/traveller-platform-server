import { BadRequestException, Controller, Logger, UnauthorizedException } from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { AuthService } from './auth.service';
import { SignInDto, VerifyOtpDto, OnboardingDto, OAuthProfileDto } from './dtos/auth.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  @GrpcMethod('AuthService', 'SignIn')
  async signIn(data: SignInDto) {
    try {
      return await this.authService.signIn(data);
    } catch (error:any) {
      this.logger.error(`gRPC SignIn error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2, // INVALID_ARGUMENT or INTERNAL
        message: error.message,
      });
    }
  }

  @GrpcMethod('AuthService', 'VerifyOtp')
  async verifyOtp(data: VerifyOtpDto) {
    try {
      return await this.authService.verifyOtp(data);
    } catch (error:any) {
      //this.logger.error(`gRPC VerifyOtp error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof UnauthorizedException ? 16 : (error instanceof BadRequestException ? 3 : 2), // UNAUTHENTICATED, INVALID_ARGUMENT, or INTERNAL
        message: error.message,
      });
    }
  }

  @GrpcMethod('AuthService', 'CompleteOnboarding')
  async completeOnboarding(data: { userId: string } & OnboardingDto) {
    try {
      return await this.authService.completeOnboarding(data.userId, data);
    } catch (error:any) {
      this.logger.error(`gRPC CompleteOnboarding error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2, // INVALID_ARGUMENT or INTERNAL
        message: error.message,
      });
    }
  }

  @GrpcMethod('AuthService', 'OAuthSignIn')
  async oAuthSignIn(data: OAuthProfileDto) {
    try {
      return await this.authService.oAuthSignIn(data);
    } catch (error:any) {
      this.logger.error(`gRPC OAuthSignIn error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2, // INVALID_ARGUMENT or INTERNAL
        message: error.message,
      });
    }
  }

  // @GrpcMethod('AuthService', 'Login')
  // async login(data: { email: string; password: string }) {
  //   try {
  //     const token = await this.authService.login(data.email, data.password);
  //     return { token };
  //   } catch (error:any) {
  //     this.logger.error(`gRPC Login error: ${error.message}`, error.stack);
  //     throw new RpcException({
  //       code: error instanceof UnauthorizedException ? 16 : 2, // UNAUTHENTICATED or INTERNAL
  //       message: error.message,
  //     });
  //   }
  // }
}
