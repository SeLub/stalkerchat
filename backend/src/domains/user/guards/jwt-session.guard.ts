import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { SessionService } from '../services/session.service';

interface RequestWithUser extends Request {
  user: {
    id: string;
    sessionId: string;
    publicKey: Buffer;
  };
}

@Injectable()
export class JwtSessionGuard implements CanActivate {
  constructor(private sessionService: SessionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Получаем access_token из куки
    const accessToken = request.cookies?.access_token;
    if (!accessToken) {
      throw new UnauthorizedException('Access token missing');
    }

    // 2. Валидируем токен
    const session = await this.sessionService.validateAccessToken(accessToken);
    if (!session || session.revoked) {
      throw new UnauthorizedException('Invalid or revoked access token');
    }

    // 3. Проверяем, не истёк ли срок действия
    if (session.expiresAt < new Date()) {
      throw new UnauthorizedException('Access token expired');
    }

    // 4. Присоединяем пользователя и sessionId к запросу
    (request as RequestWithUser).user = {
      id: session.user.id,
      sessionId: session.id,
      publicKey: session.user.publicKey,
    };

    return true;
  }
}
