import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import configuration from './configurations/configuration';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });
  
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

  app.enableCors();
  
  // Increase timeouts for long-running requests (important for Render and production)
  const server = app.getHttpServer();
  
  // Set server timeout to 5 minutes (300000ms) - useful for Render free tier
  server.timeout = 300000; // 5 minutes
  server.keepAliveTimeout = 65000; 
  server.headersTimeout = 66000; 
  
  // Increase request timeout for slow operations
  server.setTimeout(300000); // 5 minutes
  
  await app.listen(configuration().port);
  console.log(`🚀 Server running on port ${configuration().port}`);
}
bootstrap();
