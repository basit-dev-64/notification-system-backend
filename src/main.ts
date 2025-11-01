import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from './configurations/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(configuration().port);
}
bootstrap();
