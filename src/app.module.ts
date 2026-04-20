import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth';
import { RbacModule } from './modules/rbac';

@Module({
  imports: [PrismaModule, AuthModule, RbacModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
