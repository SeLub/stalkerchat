// src/domains/message/gateways/messages.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { SessionService } from '../../user/services/session.service';
import { RedisService } from '../../../common/redis.service';
import { MessagePayloadDto } from '../dtos/message-payload.dto';
import { MessageMetadataService } from '../services/message-metadata.service';

@WebSocketGateway({
  namespace: '/messages',
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  },
})
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private sessionService: SessionService,
    private redisService: RedisService,
    private messageMetadataService: MessageMetadataService
  ) {}

  async handleConnection(client: Socket) {
    try {
      // 1. Извлекаем access_token из кук (Socket.IO поддерживает!)
      const cookieHeader = client.handshake.headers.cookie;
      if (!cookieHeader) {
        client.disconnect(true);
        return;
      }

      const accessToken = cookieHeader
        .split('; ')
        .find((part) => part.startsWith('access_token='))
        ?.split('=')[1];

      if (!accessToken) {
        client.disconnect(true);
        return;
      }

      // 2. Валидируем сессию
      const session = await this.sessionService.validateAccessToken(accessToken);
      if (!session || session.revoked) {
        client.disconnect(true);
        return;
      }

      // 3. Сохраняем данные в сокет
      client.data.userId = session.user.id;
      client.data.sessionId = session.id;

      // 4. Подключаем к комнате пользователя (для 1:1 и групп)
      await client.join(`user:${session.user.id}`);

      // 5. Обновляем онлайн-статус
      const redis = this.redisService.getClient();
      await redis.setex(`online:${session.user.id}`, 60, '1');

      console.log(`🟢 User ${session.user.id} connected`);
    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data?.userId) {
      console.log(`🔴 User ${client.data.userId} disconnected`);
      // Статус "online" сбросится автоматически по TTL
    }
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: MessagePayloadDto) {
    try {
      const { to, type, encryptedContent, encryptedKey, timestamp } = payload;

      // Сохраняем метаданные и получаем ID чата
      const chatId = await this.messageMetadataService.save(client.data.userId, to, payload);

      // Отправляем сообщение всем онлайн-сокетам получателя
      this.server.to(`user:${to}`).emit('message:new', {
        from: client.data.userId,
        chatId,
        type,
        encryptedContent,
        encryptedKey,
        timestamp,
      });

      console.log(`📨 Message delivered to user ${to}`);
    } catch (error) {
      console.error('❌ Message handling error:', error);
      client.emit('message:error', { error: 'Failed to send message' });
    }
  }

  // Contact request notifications
  async notifyContactRequest(toUserId: string, fromUser: any, requestId: string, message?: string) {
    this.server.to(`user:${toUserId}`).emit('contact_request_received', {
      requestId,
      fromUser: {
        id: fromUser.id,
        displayName: fromUser.displayName,
        username: fromUser.username?.username,
      },
      message,
      timestamp: new Date().toISOString(),
    });
  }

  async notifyRequestAccepted(toUserId: string, byUser: any, chatId?: string) {
    this.server.to(`user:${toUserId}`).emit('contact_request_accepted', {
      byUser: {
        id: byUser.id,
        displayName: byUser.displayName,
        username: byUser.username?.username,
      },
      chatId,
      timestamp: new Date().toISOString(),
    });
  }

  async notifyRequestRejected(toUserId: string, byUser: any) {
    this.server.to(`user:${toUserId}`).emit('contact_request_rejected', {
      byUser: {
        id: byUser.id,
        displayName: byUser.displayName,
        username: byUser.username?.username,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
