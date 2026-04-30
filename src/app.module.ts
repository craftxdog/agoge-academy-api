import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AnalyticsModule } from './modules/analytics';
import { AuditModule } from './modules/audit';
import { AuthModule } from './modules/auth';
import { BillingModule } from './modules/billing';
import { NotificationsModule } from './modules/notifications';
import { RealtimeModule } from './modules/realtime';
import { RbacModule } from './modules/rbac';
import { SchedulesModule } from './modules/schedules';
import { SettingsModule } from './modules/settings';
import { UsersModule } from './modules/users';

@Module({
  imports: [
    PrismaModule,
    RealtimeModule,
    AnalyticsModule,
    AuditModule,
    AuthModule,
    RbacModule,
    UsersModule,
    SettingsModule,
    NotificationsModule,
    BillingModule,
    SchedulesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
