import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  JwtAuthGuard,
  ModulesGuard,
  PermissionsGuard,
  TenantGuard,
} from '../../common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthModule } from '../auth';
import { UsersRepository } from './repositories/users.repository';
import { UsersService } from './services/users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [PrismaModule, JwtModule.register({}), AuthModule],
  controllers: [UsersController],
  providers: [
    UsersRepository,
    UsersService,
    JwtAuthGuard,
    TenantGuard,
    ModulesGuard,
    PermissionsGuard,
  ],
  exports: [UsersService],
})
export class UsersModule {}
