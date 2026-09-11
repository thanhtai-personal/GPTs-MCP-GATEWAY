import { IsObject } from 'class-validator';

export class CallMcpToolDto {
  @IsObject()
  arguments!: Record<string, unknown>;
}
