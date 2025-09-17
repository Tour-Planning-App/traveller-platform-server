import { BadRequestException, Controller, Logger } from '@nestjs/common';
import { GrpcMethod, Payload, RpcException } from '@nestjs/microservices';
import { AppService } from './app.service';
import { RegisterDeviceTokenDto, SendNotificationDto, SendToAllNotificationDto, GetNotificationsDto } from './dtos/notification.dto';
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly notificationService: AppService) {}

  @GrpcMethod('NotificationService', 'SendNotifications')
  async sendNotifications(@Payload() data: SendNotificationDto) {
    try {
      const result = await this.notificationService.sendNotifications(data);
      return { status: 200, message: 'Notification sent successfully', data: result };
    } catch (error: any) {
      this.logger.error(`gRPC SendNotifications error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2, // INVALID_ARGUMENT or INTERNAL
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'SendNotificationsToAll')
  async sendNotificationsToAll(@Payload() data: SendToAllNotificationDto) {
    try {
      const result = await this.notificationService.sendNotificationsToAll(data);
      return { status: 200, message: 'Global notification sent successfully', data: result };
    } catch (error: any) {
      this.logger.error(`gRPC SendNotificationsToAll error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2, // INVALID_ARGUMENT or INTERNAL
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'RegisterDeviceToken')
  async registerDeviceToken(@Payload() data: RegisterDeviceTokenDto) {
    try {
      const result = await this.notificationService.registerDeviceToken(data);
      return { status: 200, message: 'Token registered successfully', data: result };
    } catch (error: any) {
      this.logger.error(`gRPC RegisterDeviceToken error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2, // INVALID_ARGUMENT or INTERNAL
        message: error.message,
      });
    }
  }

  @GrpcMethod('NotificationService', 'GetNotifications')
  async getNotifications(@Payload() data: GetNotificationsDto) {
    try {
      const result = await this.notificationService.getNotifications(data);
      return { status: 200, message: 'Notifications fetched successfully', data: result };
    } catch (error: any) {
      this.logger.error(`gRPC GetNotifications error: ${error.message}`, error.stack);
      throw new RpcException({
        code: error instanceof BadRequestException ? 3 : 2, // INVALID_ARGUMENT or INTERNAL
        message: error.message,
      });
    }
  }
}
