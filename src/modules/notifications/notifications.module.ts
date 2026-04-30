import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  JwtAuthGuard,
  ModulesGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsRepository } from './repositories';
import { NotificationsService } from './services';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [NotificationsController],
  providers: [
    NotificationsRepository,
    NotificationsService,
    JwtAuthGuard,
    TenantGuard,
    ModulesGuard,
    PermissionsGuard,
  ],
  exports: [NotificationsService],
})
export class NotificationsModule {}
