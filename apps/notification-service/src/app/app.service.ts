import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Notification , UserDevice} from './schemas/notification.schema';
import { NotificationGateway } from './app.gateway';
import Expo from 'expo-server-sdk';

@Injectable()
export class AppService {
    private expo = new Expo();

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    @InjectModel(UserDevice.name)
    private readonly deviceModel: Model<UserDevice>,
    @Inject('NOTIFY_EMAIL_SERVICE') private readonly emailClient: ClientKafka,
    private readonly notificationGateway: NotificationGateway,
  ) {}


  async sendNotifications(data: any): Promise<any> {
    const { email, title, content } = data;

    // Validate input
    if (!email || !title || !content) {
      throw new BadRequestException('Email, title, and content are required.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format.');
    }

    try {
      // Save notification to database
      const notification = new this.notificationModel({
        email,
        title,
        content,
        isGlobal: false,
      });
      await notification.save();

      // Emit email notification event
      await this.emailClient.emit('send_notification_email', {
        email,
        title,
        content,
      }).toPromise();

      // Emit WebSocket notification to the specific user
      await this.notificationGateway.sendNotificationToUser(email, {
        title,
        content,
      });

      await this.sendExpoNotificationToUser(email, title, content);

      return notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new BadRequestException('Failed to send notification.');
    }
  }

  async sendNotificationsToAll(data: any): Promise<any> {
    const { title, content } = data;
    try {
      const notification = new this.notificationModel({
        email: null,
        title,
        content,
        isGlobal: true,
      });
      await notification.save();

      // Emit email notification to all users (via Kafka if needed, or skip for global)
      // For global, you might want to emit to all emails, but that's expensive; consider a broadcast pattern

      await this.notificationGateway.sendNotificationToAllUsers({ title, content });

      await this.sendExpoNotificationToAllUsers(title, content);

      return {
        message: 'Notification sent to all users successfully',
      };
    } catch (error) {
      console.error('Error sending notification to all users:', error);
      throw new BadRequestException(
        'Failed to send notification to all users.',
      );
    }
  }

  async getNotifications(data: any): Promise<any> {
    const { email } = data;

    if (!email) {
      throw new BadRequestException('Email is required.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format.');
    }

    try {
      const globalNotifications = await this.notificationModel.find({ isGlobal: true }).exec();

      const userNotifications = await this.notificationModel.find({ email }).exec();

      const notifications = [...globalNotifications, ...userNotifications];

      if (!notifications || notifications.length === 0) {
        throw new NotFoundException(
          'No notifications found for the given email.',
        );
      }

      notifications.sort((a, b) => {
        const dateA = new Date(a.createdAt ?? 0).getTime();
        const dateB = new Date(b.createdAt ?? 0).getTime();
        return dateB - dateA;
      });

      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  async registerDeviceToken(data: any) {
    const { userId, email, expoPushToken } = data;

    if (!userId || !email || !expoPushToken) {
      throw new BadRequestException(
        'User ID, email, and Expo Push Token are required.',
      );
    }

    try {
      let device = await this.deviceModel.findOne({ userId }).exec();

      if (!device) {
        device = new this.deviceModel({
          userId,
          email,
          expoPushToken: [expoPushToken],
        });
      } else {
        if (!device.expoPushToken.includes(expoPushToken)) {
          device.expoPushToken.push(expoPushToken);
        }
      }

      await device.save();

      return device;
    } catch (error) {
      console.error('Error registering device token:', error);
      throw new BadRequestException('Failed to register device token.');
    }
  }

  private async sendExpoNotificationToUser(
    email: string,
    title: string,
    content: string,
  ) {
    try {
      const userDevice = await this.deviceModel.findOne({ email }).exec();
      if (
        !userDevice ||
        !userDevice.expoPushToken ||
        userDevice.expoPushToken.length === 0
      ) {
        console.warn(`No Expo Push Tokens found for user with email: ${email}`);
        return;
      }

      const messages = userDevice.expoPushToken.map((token) => ({
        to: token,
        sound: 'default',
        title,
        body: content,
      }));

      const chunks = this.expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          const tickets = await this.expo.sendPushNotificationsAsync(chunk);
          console.log('Push notification tickets:', tickets);
        } catch (error) {
          console.error('Error sending push notifications:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching user device tokens:', error);
    }
  }

  private async sendExpoNotificationToAllUsers(title: string, content: string) {
    try {
      const userDevices = await this.deviceModel.find().exec();
      if (!userDevices || userDevices.length === 0) {
        console.warn('No users with Expo Push Tokens found.');
        return;
      }

      const allTokens = new Set(
        userDevices.flatMap((userDevice) => userDevice.expoPushToken),
      );

      const validTokens = Array.from(allTokens).filter((token) =>
        Expo.isExpoPushToken(token),
      );

      if (validTokens.length === 0) {
        console.warn('No valid Expo Push Tokens found.');
        return;
      }
      const imageUrl = "https://i.ibb.co/4nZ6Lwtz/pin-8-96.png";

      const messages = validTokens.map((token) => ({
        to: token,
        sound: 'default',
        title,
        body: content,
        data: {
          imageUrl: imageUrl || undefined,
          iconUrl: imageUrl || undefined,
        },
        icon: imageUrl,
      }));
      const chunks = this.expo.chunkPushNotifications(messages);
      for (const chunk of chunks) {
        try {
          const tickets = await this.expo.sendPushNotificationsAsync(chunk);
          console.log('Push notification tickets:', tickets);
        } catch (error) {
          console.error('Error sending push notifications:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching user device tokens:', error);
    }
  }
}
