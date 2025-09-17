import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject } from '@nestjs/common';
import { AppService } from './app.service';

@WebSocketGateway(3005, { cors: true })
export class NotificationGateway {
  @WebSocketServer()
  server: Server;

  private userConnections: Map<string, string[]> = new Map();

  constructor(
    @Inject(forwardRef(() => AppService))
    private readonly notificationService: AppService
  ) {}

  handleConnection(client: Socket) {
    const email = client.handshake.query.email as string;
    if (email) {
      client.join(email);

      if (!this.userConnections.has(email)) {
        this.userConnections.set(email, []);
      }

      const connections = this.userConnections.get(email);
      if (connections) {
        connections.push(client.id);
      }
      this.emitAllNotificationsForUser(email);
    }
  }

  handleDisconnect(client: Socket) {
    const email = client.handshake.query.email as string;
    if (email && this.userConnections.has(email)) {
      const connections = this.userConnections.get(email);
      if (connections) {
        const updatedConnections = connections.filter((id) => id !== client.id);

        if (updatedConnections.length === 0) {
          this.userConnections.delete(email);
        } else {
          this.userConnections.set(email, updatedConnections);
        }
      }
    }
  }

  async emitAllNotificationsForUser(email: string) {
    try {
      const allNotifications = await this.notificationService.getNotifications({ email });
      this.server.to(email).emit('allNotifications', allNotifications);
    } catch (error) {
      console.error(`Error emitting all notifications for user ${email}:`, error);
    }
  }

  async sendNotificationToUser(email: string, data: { title: string; content: string }) {
    this.server.to(email).emit('notification', data);
    await this.emitAllNotificationsForUser(email);
  }

  async sendNotificationToAllUsers(data: { title: string; content: string }) {
    this.server.emit('notification', data);
    this.userConnections.forEach(async (_, email) => {
      await this.emitAllNotificationsForUser(email);
    });
  }
}