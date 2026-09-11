import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@server/root/common/config/app-config.service';
import { buildStoredZip } from '@server/root/modules/gpt-integration/zip.util';

export type IntegrationLanguage = 'vi' | 'en';

@Injectable()
export class GptIntegrationService {
  constructor(private readonly config: AppConfigService) {}

  buildBundle(language: IntegrationLanguage) {
    const files = [
      { name: 'instructions.md', content: this.instructions(language) },
      { name: 'knowledge.md', content: this.knowledge(language) },
      { name: 'openapi.yaml', content: this.openApiSchema() },
      { name: 'setup-guide.md', content: this.setupGuide(language) },
    ];
    return {
      language,
      files,
      zip: buildStoredZip(files),
    };
  }

  schema(): string {
    return this.openApiSchema();
  }

  private instructions(language: IntegrationLanguage): string {
    if (language === 'vi') {
      return `# MCP Gateway Instructions

Bạn có quyền sử dụng MCP Gateway thông qua Actions đã cấu hình.

## Luồng bắt buộc

Khi yêu cầu của user cần công cụ bên ngoài:

1. Phân tích **intent** và **capability** cần thiết.
2. Chọn MCP service phù hợp từ các service Gateway hỗ trợ.
3. Gọi \`listMcpTools\` cho service đó để lấy tool catalog hiện tại.
4. Chọn tool dựa trên name, description và inputSchema; không đoán arguments không có trong schema.
5. Gọi \`callMcpTool\` với đúng service, toolName và arguments.
6. Đọc kết quả MCP rồi trả lời user.

## Quy tắc

- Gateway là execution boundary bắt buộc. Không hướng dẫn GPT gọi thẳng MCP provider để bypass Gateway.
- Không yêu cầu hoặc tiết lộ provider API key.
- Không hardcode danh sách Stitch tools trong memory; discovery runtime là nguồn đúng hơn.
- Nếu nhận \`MCP_NOT_CONNECTED\`, hướng dẫn user kết nối provider trong MCP Gateway app.
- Nếu nhận \`OPEN_ID_REQUIRED\`, nói rõ account cần active Open ID/trial. Không thử bypass.
- Nếu tool không phù hợp, gọi lại \`listMcpTools\` và chọn tool khác thay vì tự bịa endpoint.
`;
    }
    return `# MCP Gateway Instructions

You can use MCP Gateway through the configured Actions.

## Required routing flow

When the user's request needs an external tool:

1. Determine the user's **intent** and required **capability**.
2. Select the supported MCP service that owns that capability.
3. Call \`listMcpTools\` for that service to obtain the current tool catalog.
4. Choose a tool from its name, description and inputSchema. Do not invent unsupported arguments.
5. Call \`callMcpTool\` with the exact service, toolName and arguments.
6. Interpret the MCP result and answer the user.

## Rules

- Gateway is the mandatory execution boundary. Never bypass it by calling the MCP provider directly.
- Never ask for, expose, or forward provider API keys.
- Do not permanently hardcode Stitch tool names; runtime discovery is authoritative.
- On \`MCP_NOT_CONNECTED\`, tell the user to connect that provider in the MCP Gateway app.
- On \`OPEN_ID_REQUIRED\`, tell the user an active Open ID or trial is required. Do not bypass the entitlement.
- If a selected tool does not fit, refresh \`listMcpTools\` and choose again rather than inventing an endpoint.
`;
  }

  private knowledge(language: IntegrationLanguage): string {
    const intro =
      language === 'vi'
        ? 'MCP Gateway giúp Custom GPT sử dụng MCP tương tự coding agent: GPT tự discovery tool rồi gọi qua một gateway có kiểm soát.'
        : 'MCP Gateway lets a Custom GPT use MCP in an agent-like way: discover current tools and execute them through one controlled gateway.';
    return `# MCP Gateway Knowledge

${intro}

## Stable concepts

- **Open ID**: commercial entitlement that authorizes Gateway MCP execution.
- **Gateway token**: bearer secret configured in GPT Actions. The token authenticates a request; the linked Open ID authorizes it.
- **Trial Open ID**: internal, non-exportable entitlement created when a Guest explicitly starts the one-time 7-day trial.
- **Provider credential**: API key stored by the user in the app. It is encrypted server-side and never sent to GPT.
- **MCP service**: a provider explicitly supported by Gateway.
- **Stitch**: first supported service, provider id \`stitch\`.

## Routing syntax

\`\`\`
Intent
  -> Capability
  -> MCP Service
  -> listMcpTools(service)
  -> select tool
  -> callMcpTool(service, toolName, arguments)
  -> interpret result
\`\`\`

## Important errors

- \`UNAUTHORIZED\`: Gateway bearer token is missing/invalid.
- \`TOKEN_EXPIRED\`: Gateway token expired.
- \`OPEN_ID_REQUIRED\`: the linked entitlement is absent/inactive; Gateway must not call MCP.
- \`MCP_NOT_CONNECTED\`: user has not connected the selected MCP service.
- \`MCP_PROVIDER_UNSUPPORTED\`: service is not supported by this Gateway.
- \`MCP_TOOL_CALL_FAILED\`: provider rejected or failed the tool call.
- \`MCP_SERVICE_UNAVAILABLE\`: temporary upstream problem.

Runtime Action responses are newer authority than this static knowledge file.
`;
  }

  private setupGuide(language: IntegrationLanguage): string {
    if (language === 'vi') {
      return `# Setup Custom GPT

1. Trong GPT Builder, mở **Actions** và import \`openapi.yaml\`.
2. Chọn API authentication / Bearer và nhập Gateway token được app hiển thị một lần.
3. Dán nội dung \`instructions.md\` vào Instructions.
4. Upload \`knowledge.md\` vào Knowledge.
5. Test action \`getGatewayProfile\`.
6. Nếu chưa có trial/Open ID hợp lệ, hãy tạo trial hoặc mua Open ID trong app.

Không đưa Stitch API key vào GPT Builder.
`;
    }
    return `# Custom GPT setup

1. In GPT Builder open **Actions** and import \`openapi.yaml\`.
2. Configure API/Bearer authentication with the one-time Gateway token shown by the app.
3. Add \`instructions.md\` to Instructions.
4. Upload \`knowledge.md\` as Knowledge.
5. Test \`getGatewayProfile\`.
6. If no active trial/Open ID exists, start the trial or activate a paid Open ID in the app.

Never paste the Stitch API key into GPT Builder.
`;
  }

  private openApiSchema(): string {
    const server = `${this.config.publicBaseUrl.replace(/\/+$/u, '')}/api/v1`;
    return `openapi: 3.1.0
info:
  title: MCP Gateway Actions
  version: 1.0.0
  description: Discover and call user-authorized MCP services through MCP Gateway.
servers:
  - url: ${server}
paths:
  /gpt/profile:
    get:
      operationId: getGatewayProfile
      summary: Get the active Gateway/Open ID profile and connected MCP services.
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Gateway profile
  /gpt/mcp/services:
    get:
      operationId: listMcpServices
      summary: List MCP services supported by Gateway and their connection status.
      security:
        - bearerAuth: []
      responses:
        '200':
          description: MCP services
  /gpt/mcp/{service}/tools:
    get:
      operationId: listMcpTools
      summary: Discover the current tools exposed by one MCP service.
      security:
        - bearerAuth: []
      parameters:
        - name: service
          in: path
          required: true
          schema:
            type: string
            enum: [stitch]
      responses:
        '200':
          description: MCP tool catalog
  /gpt/mcp/{service}/tools/{toolName}/call:
    post:
      operationId: callMcpTool
      summary: Execute one discovered MCP tool through Gateway.
      security:
        - bearerAuth: []
      parameters:
        - name: service
          in: path
          required: true
          schema:
            type: string
            enum: [stitch]
        - name: toolName
          in: path
          required: true
          schema:
            type: string
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [arguments]
              properties:
                arguments:
                  type: object
                  additionalProperties: true
      responses:
        '200':
          description: MCP tool result
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: MCP_GATEWAY_TOKEN
`;
  }
}
