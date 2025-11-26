import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from './db/database.module';
import { UserModule } from './domains/user/user.module';
import { UsernameModule } from './domains/username/username.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    DatabaseModule,
    UserModule,
    UsernameModule,
  ],
})
export class AppModule {
  static configureCors(configService: ConfigService) {
    const origins = configService.get<string>('CORS_ORIGINS');
    return {
      origin: origins ? origins.split(',') : ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true,
    };
  }
}