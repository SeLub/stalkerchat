import './env';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { handleUncaughtErrors, handleShutdownSignals } from './common/fatal';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from './common/pino-logger.service';
import { registerSwagger } from './swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';

// В самом начале main.ts, после импортов
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('🚨 CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('Stack:', reason?.stack);
  process.exit(1);
});

async function bootstrap() {
  handleUncaughtErrors();
  handleShutdownSignals();

  const app = await NestFactory.create(AppModule);

  app.useWebSocketAdapter(new IoAdapter(app));

  // Логгер
  app.useLogger(new PinoLogger());

  // CORS из конфига
  const configService = app.get(ConfigService);
  app.enableCors(AppModule.configureCors(configService));

  // Прочее
  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Swagger
  await registerSwagger(app);

  const port = configService.get('PORT', 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📘 Swagger UI: http://localhost:${port}/docs`);
}

bootstrap();
