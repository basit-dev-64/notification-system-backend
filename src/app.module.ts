import { Logger, Module } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { JwtService } from './services/jwt/jwt.service';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './configurations/configuration';
import { NotificationsModule } from './modules/notifications/notifications.module';


const mongoUri = configuration().mongoUri;

@Module({
  imports: [
    MongooseModule.forRoot(mongoUri as string),
    AuthModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [JwtService],
})
export class AppModule {}
