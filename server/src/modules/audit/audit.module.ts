import { Global, Module } from '@nestjs/common';
import { AuditService } from '@server/root/modules/audit/audit.service';

@Global()
@Module({
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
