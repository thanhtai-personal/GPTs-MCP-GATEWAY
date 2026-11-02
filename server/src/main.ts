import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from '@server/root/app.module';
import type { Request, Response } from 'express';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { mcpProtectedResourceMetadata } from '@server/root/modules/mcp-server/mcp-server.oauth';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);

  app.use(
    helmet({
      contentSecurityPolicy: false,
      strictTransportSecurity:
        process.env.NODE_ENV === 'production'
          ? { includeSubDomains: true, maxAge: 31_536_000 }
          : false,
    }),
  );

  // OAuth protected resource metadata for the MCP endpoint (outside /api).
  app
    .getHttpAdapter()
    .getInstance()
    .get(
      [
        '/.well-known/oauth-protected-resource',
        '/.well-known/oauth-protected-resource/api/v1/mcp',
      ],
      (_request: Request, response: Response) => {
        response.setHeader('Access-Control-Allow-Origin', '*');
        response.json(mcpProtectedResourceMetadata(config));
      },
    );

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const allowedOrigins = new Set(config.corsAllowedOrigins);
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (error: Error | null, allowed?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS_ORIGIN_DENIED'));
    },
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Mcp-Protocol-Version', 'Mcp-Session-Id'],
    exposedHeaders: ['WWW-Authenticate', 'Mcp-Session-Id'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('MCP Gateway API')
    .setDescription('Open ID controlled Gateway for Custom GPT -> MCP integrations')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.port, '127.0.0.1');
  console.info(`[mcp-gateway] listening on http://127.0.0.1:${config.port}`);
}

void bootstrap();
