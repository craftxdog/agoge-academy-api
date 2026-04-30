import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  JwtAuthGuard,
  ModulesGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common';
import { PrismaModule } from '../../database/prisma.module';
import { NotificationsModule } from '../notifications';
import { SchedulesRepository } from './repositories';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './services';

@Module({
  imports: [PrismaModule, JwtModule.register({}), NotificationsModule],
  controllers: [SchedulesController],
  providers: [
    SchedulesRepository,
    SchedulesService,
    JwtAuthGuard,
    TenantGuard,
    ModulesGuard,
    PermissionsGuard,
  ],
  exports: [SchedulesService],
})
export class SchedulesModule {}
