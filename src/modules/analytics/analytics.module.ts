import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  JwtAuthGuard,
  ModulesGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common';
import { PrismaModule } from '../../database/prisma.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsRepository } from './repositories';
import { AnalyticsService } from './services';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsRepository,
    AnalyticsService,
    JwtAuthGuard,
    TenantGuard,
    ModulesGuard,
    PermissionsGuard,
  ],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
