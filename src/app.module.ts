import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth';
import { BillingModule } from './modules/billing';
import { RbacModule } from './modules/rbac';
import { SchedulesModule } from './modules/schedules';
import { SettingsModule } from './modules/settings';
import { UsersModule } from './modules/users';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    RbacModule,
    UsersModule,
    SettingsModule,
    BillingModule,
    SchedulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
