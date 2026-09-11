import { Module } from '@nestjs/common';
import { HealthController } from '@server/root/modules/health/health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
