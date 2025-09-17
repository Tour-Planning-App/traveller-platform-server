import { Body, Controller, Get, Inject, Logger, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RegisterDeviceTokenDto, SendNotificationDto, SendToAllNotificationDto, GetNotificationsDto, NotificationResponseDto } from './dtos/notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/decorators/role.enum';
import { ClientGrpcProxy } from '@nestjs/microservices';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
private notificationService: any;
  private readonly logger = new Logger(NotificationController.name);

  constructor(@Inject('NOTIFICATION_PACKAGE') private client: ClientGrpcProxy) {
    this.notificationService = this.client.getService('NotificationService');
  }

  @Post('send')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TRAVELER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send notification to specific user' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully', type: NotificationResponseDto })
  async sendNotifications(@Body() dto: SendNotificationDto) {
    const result = await this.notificationService.sendNotifications(dto);
    return { status: 200, message: 'Notification sent successfully', data: result };
  }

  @Post('register-token')
  @ApiOperation({ summary: 'Register device token for push notifications' })
  @ApiResponse({ status: 200, description: 'Token registered successfully', type: NotificationResponseDto })
  async registerDeviceToken(@Body() dto: RegisterDeviceTokenDto) {
    const result = await this.notificationService.registerDeviceToken(dto);
    return { status: 200, message: 'Token registered successfully', data: result };
  }

  @Post('send-all')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send global notification to all users' })
  @ApiResponse({ status: 200, description: 'Global notification sent successfully', type: NotificationResponseDto })
  async sendNotificationsToAll(@Body() dto: SendToAllNotificationDto) {
    const result = await this.notificationService.sendNotificationsToAll(dto);
    return { status: 200, message: 'Global notification sent successfully', data: result };
  }

  @Get('get-notifications/:email')
  @UseGuards(JwtAuthGuard)
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.TRAVELER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notifications for user' })
  @ApiResponse({ status: 200, description: 'Notifications fetched successfully', type: NotificationResponseDto })
  async getNotifications(@Param('email') email: string) {
    const result = await this.notificationService.getNotifications({ email });
    return { status: 200, message: 'Notifications fetched successfully', data: result };
  }
}
