import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  JwtAuthGuard,
  ModulesGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common';
import { PrismaModule } from '../../database/prisma.module';
import { BillingController } from './billing.controller';
import { BillingRepository } from './repositories/billing.repository';
import { BillingService } from './services/billing.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [BillingController],
  providers: [
    BillingRepository,
    BillingService,
    JwtAuthGuard,
    TenantGuard,
    ModulesGuard,
    PermissionsGuard,
  ],
  exports: [BillingService],
})
export class BillingModule {}
