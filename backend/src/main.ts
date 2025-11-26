import './env'; 
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import * as cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { handleUncaughtErrors, handleShutdownSignals } from './common/fatal';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from './common/pino-logger.service';
import { registerSwagger } from './swagger';

async function bootstrap() {
  handleUncaughtErrors();
  handleShutdownSignals();

  const app = await NestFactory.create(AppModule);

  // Логгер
  app.useLogger(new PinoLogger());

  // CORS из конфига
  const configService = app.get(ConfigService);
  app.enableCors(AppModule.configureCors(configService));

  // Прочее
  app.use(cookieParser());
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));

  // Swagger
  await registerSwagger(app);

  const port = configService.get('PORT', 4000);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📘 Swagger UI: http://localhost:${port}/docs`);
}

bootstrap();