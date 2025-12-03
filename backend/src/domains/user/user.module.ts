// src/domains/user/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Session } from './session.entity';
import { AuthController } from './controllers/auth.controller';
import { AuthSessionController } from './controllers/auth-session.controller';
import { OnlineStatusController } from './controllers/online-status.controller'; // ← новый
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service'; // ← новый
import { SessionService } from './services/session.service'; // ← новый
import { RedisService } from '../../common/redis.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Session])],
  controllers: [AuthController, AuthSessionController, OnlineStatusController],
  providers: [UserService, AuthService, SessionService, RedisService],
  exports: [SessionService],
})
export class UserModule {}