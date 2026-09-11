import { Module } from '@nestjs/common';
import { AuthController } from '@server/root/modules/auth/auth.controller';
import { AuthService } from '@server/root/modules/auth/auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
