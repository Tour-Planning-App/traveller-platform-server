import { Body, Controller, Get, Inject, Logger, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBadRequestResponse, ApiBearerAuth, ApiInternalServerErrorResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDeviceTokenDto, SendNotificationDto, SendToAllNotificationDto, GetNotificationsDto, NotificationResponseDto } from './dtos/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/decorators/role.enum';
import { ClientGrpcProxy } from '@nestjs/microservices';
import { Public } from '../auth/decorators/public.decorator';
import { firstValueFrom, catchError } from 'rxjs';
import { HttpStatus } from '@nestjs/common';
import { HttpException } from '@nestjs/common';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
private notificationService: any;
  private readonly logger = new Logger(NotificationController.name);

  constructor(@Inject('NOTIFICATION_PACKAGE') private client: ClientGrpcProxy) {
    this.notificationService = this.client.getService('NotificationService');
  }

  @Public()
  @Post('register-token')
  @ApiOperation({ summary: 'Register device token for push notifications' })
  @ApiResponse({ status: 200, description: 'Token registered successfully' })
  @ApiBadRequestResponse({ description: 'Invalid token registration data' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during token registration' })
  async registerDeviceToken(@Body() dto: any) {
    try {
      const result = await firstValueFrom(
        this.notificationService.RegisterDeviceToken(dto).pipe(
          catchError((error) => {
            this.logger.error(`RegisterDeviceToken error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during token registration', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid token registration data', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Failed to register token', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`RegisterDeviceToken failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TRAVELER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send notification to specific user' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  @ApiBadRequestResponse({ description: 'Invalid notification data' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during notification send' })
  async sendNotifications(@Body() dto: SendNotificationDto, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const result = await firstValueFrom(
        this.notificationService.SendNotifications(dto).pipe(
          catchError((error) => {
            this.logger.error(`SendNotifications error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during notification send', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid notification data', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Failed to send notification', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`SendNotifications failed: ${error.message}`, error.stack);
      throw error;
    }
  }



  @Post('send-all')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send global notification to all users' })
  @ApiResponse({ status: 200, description: 'Global notification sent successfully' })
  @ApiBadRequestResponse({ description: 'Invalid global notification data' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during global notification send' })
  async sendNotificationsToAll(@Body() dto: SendToAllNotificationDto, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const result = await firstValueFrom(
        this.notificationService.SendNotificationsToAll(dto).pipe(
          catchError((error) => {
            this.logger.error(`SendNotificationsToAll error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during global notification send', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid global notification data', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Failed to send global notification', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`SendNotificationsToAll failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  @Get('get-notifications/:email')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TRAVELER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notifications for user' })
  @ApiResponse({ status: 200, description: 'Notifications fetched successfully' })
  @ApiBadRequestResponse({ description: 'Invalid email' })
  @ApiInternalServerErrorResponse({ description: 'Internal server error during notification fetch' })
  async getNotifications(@Param('email') email: string, @Req() req: any) {
    try {
      const userId = req?.user?.userId;
      if (!userId) return { success: false, message: 'User not authenticated' };

      const dto = { email };
      const result = await firstValueFrom(
        this.notificationService.GetNotifications(dto).pipe(
          catchError((error) => {
            this.logger.error(`GetNotifications error: ${error.message}`, error.stack);
            if (error.code === 2 || error.code === 'INTERNAL') {
              throw new HttpException('Internal server error during notification fetch', HttpStatus.INTERNAL_SERVER_ERROR);
            } else if (error.code === 3 || error.code === 'INVALID_ARGUMENT') {
              throw new HttpException('Invalid email', HttpStatus.BAD_REQUEST);
            } else {
              throw new HttpException('Failed to fetch notifications', HttpStatus.BAD_REQUEST);
            }
          })
        )
      );
      return result;
    } catch (error: any) {
      this.logger.error(`GetNotifications failed: ${error.message}`, error.stack);
      throw error;
    }
  }
}
