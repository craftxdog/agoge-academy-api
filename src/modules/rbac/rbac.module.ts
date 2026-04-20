import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  JwtAuthGuard,
  ModulesGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common';
import { PrismaModule } from '../../database/prisma.module';
import { RbacRepository } from './repositories/rbac.repository';
import { RbacController } from './rbac.controller';
import { RbacService } from './services/rbac.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [RbacController],
  providers: [
    RbacRepository,
    RbacService,
    JwtAuthGuard,
    TenantGuard,
    ModulesGuard,
    PermissionsGuard,
  ],
  exports: [RbacService],
})
export class RbacModule {}
