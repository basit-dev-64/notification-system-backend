import * as dotenv from 'dotenv';
dotenv.config();
import { Logger, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { JwtService } from './services/jwt/jwt.service';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './configurations/configuration';
import { NotificationsModule } from './modules/notifications/notifications.module';


const mongoUri = configuration().mongoUri;

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make config available globally
      envFilePath: '.env', // Load .env file
    }),
    MongooseModule.forRoot(mongoUri as string),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [JwtService],
})
export class AppModule {}
