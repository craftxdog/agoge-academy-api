import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  JwtAuthGuard,
  ModulesGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common';
import { PrismaModule } from '../../database/prisma.module';
import { AuditController } from './audit.controller';
import { AuditRepository } from './repositories';
import { AuditService } from './services';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AuditController],
  providers: [
    AuditRepository,
    AuditService,
    JwtAuthGuard,
    TenantGuard,
    ModulesGuard,
    PermissionsGuard,
  ],
  exports: [AuditService],
})
export class AuditModule {}
