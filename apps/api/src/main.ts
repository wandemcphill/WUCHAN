import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { applyMigrations, shouldApplyMigrations } from './database/apply-migrations';

async function bootstrap() {
  if (shouldApplyMigrations()) {
    await applyMigrations(process.env.DATABASE_URL as string);
  }

  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = Number(process.env.PORT || 3001);
  const host = process.env.HOST || '0.0.0.0';
  await app.listen(port, host);
  console.log(`WUCHAN NestJS API running on ${host}:${port}`);
}

bootstrap().catch((error: unknown) => {
  console.error('WUCHAN API failed to start', error);
  process.exit(1);
});
