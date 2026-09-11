import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadEnvFile } from 'node:process';

function loadLocalEnv(): void {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL === '1') {
    return;
  }

  const candidates = [
    resolve(process.cwd(), '.env'),
    resolve(process.cwd(), 'server', '.env'),
  ];

  for (const envPath of candidates) {
    if (!existsSync(envPath)) {
      continue;
    }

    loadEnvFile(envPath);
    return;
  }
}

loadLocalEnv();
