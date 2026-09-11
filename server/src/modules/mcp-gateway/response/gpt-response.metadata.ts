import { SetMetadata } from '@nestjs/common';

export const SKIP_GPT_RESPONSE_ENVELOPE = 'skipGptResponseEnvelope';

export const SkipGptResponseEnvelope = () =>
  SetMetadata(SKIP_GPT_RESPONSE_ENVELOPE, true);
