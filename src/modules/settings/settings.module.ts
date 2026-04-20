import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  JwtAuthGuard,
  ModulesGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common';
import { PrismaModule } from '../../database/prisma.module';
import { SettingsRepository } from './repositories/settings.repository';
import { SettingsController } from './settings.controller';
import { SettingsService } from './services/settings.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [SettingsController],
  providers: [
    SettingsRepository,
    SettingsService,
    JwtAuthGuard,
    TenantGuard,
    ModulesGuard,
    PermissionsGuard,
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
