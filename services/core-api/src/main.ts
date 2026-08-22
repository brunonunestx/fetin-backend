import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { parseCorsOrigins } from './common/config/cors';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JsonLoggerService } from './common/logger/json-logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(new JsonLoggerService());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);

  if (corsOrigins) {
    app.enableCors({ origin: corsOrigins });
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
