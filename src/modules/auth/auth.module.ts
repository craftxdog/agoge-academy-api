import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard, OptionalJwtAuthGuard } from '../../common';
import { PrismaModule } from '../../database/prisma.module';
import { AuthController } from './auth.controller';
import { AuthRepository } from './repositories/auth.repository';
import { AuthService } from './services/auth.service';
import { PasswordService } from './services/password.service';

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthRepository,
    AuthService,
    PasswordService,
    JwtAuthGuard,
    OptionalJwtAuthGuard,
  ],
  exports: [AuthService, PasswordService],
})
export class AuthModule {}
