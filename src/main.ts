import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from './configurations/configuration';
import { timeout } from 'rxjs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS configuration - allow frontend origins
  // const allowedOrigins = [
  //   'http://localhost:3001',
  //   process.env.FRONTEND_URL,
  // ].filter(Boolean);
  
  // app.enableCors({
  //   origin: allowedOrigins.length > 0 ? allowedOrigins : true, // Allow all in development
  //   credentials: true,
  //   methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT'],
  //   allowedHeaders: ['Content-Type', 'Authorization'],
  // });

  // For Render timeouts
  app.use(timeout(300000));

  app.enableCors();
  
  await app.listen(configuration().port);
  console.log(`🚀 Server running on port ${configuration().port}`);
}
bootstrap();
