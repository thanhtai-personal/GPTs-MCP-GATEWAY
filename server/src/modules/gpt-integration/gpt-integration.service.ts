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
3. Gọi \`listMcpTools\` cho service đó để lấy catalog rút gọn hiện tại.
4. Chọn tool candidate dựa trên name, title và description.
5. Gọi \`getMcpToolSchema\` cho tool đã chọn để lấy inputSchema đầy đủ.
6. Chỉ tạo arguments có trong schema vừa lấy.
7. Gọi \`callMcpTool\` với đúng service, toolName và arguments.
8. Đọc Gateway response envelope:
   - Nếu \`mode = complete\`, dùng \`data\`.
   - Nếu \`mode = chunked\`, giữ \`transfer.id\`, đọc \`chunk\`, rồi gọi \`getGatewayResponseChunk\` với \`transfer.nextChunkIndex\` cho đến khi \`hasMore = false\`.
9. Với response chunked, xử lý các chunk theo đúng \`chunkIndex\`. Các \`chunk\` là các đoạn liên tiếp của một JSON document đã serialize; không được giả định chunk đầu là toàn bộ kết quả.
10. Sau khi đã lấy đủ dữ liệu cần thiết, tổng hợp và trả lời user.

## Quy tắc

- Gateway là execution boundary bắt buộc. Không hướng dẫn GPT gọi thẳng MCP provider để bypass Gateway.
- Không yêu cầu hoặc tiết lộ provider API key.
- Không hardcode danh sách Stitch tools trong memory; discovery runtime là nguồn đúng hơn.
- Nếu nhận \`MCP_NOT_CONNECTED\`, hướng dẫn user kết nối provider trong MCP Gateway app.
- Nếu nhận \`OPEN_ID_REQUIRED\`, nói rõ account cần active Open ID/trial. Không thử bypass.
- \`listMcpTools\` chỉ là catalog rút gọn; luôn lấy schema của tool đã chọn bằng \`getMcpToolSchema\` trước khi gọi.
- Nếu tool không phù hợp, gọi lại \`listMcpTools\` và chọn tool khác thay vì tự bịa endpoint.
- Mọi GPT-facing success response đều có envelope \`complete\` hoặc \`chunked\`.
- Nếu \`mode = chunked\`, bắt buộc tiếp tục gọi \`getGatewayResponseChunk\`; không báo user rằng dữ liệu bị thiếu chỉ vì response đầu tiên chưa chứa hết.
- Transfer chunk có thời hạn ngắn. Lấy các chunk cần thiết ngay trong cùng workflow.
`;
    }
    return `# MCP Gateway Instructions

You can use MCP Gateway through the configured Actions.

## Required routing flow

When the user's request needs an external tool:

1. Determine the user's **intent** and required **capability**.
2. Select the supported MCP service that owns that capability.
3. Call \`listMcpTools\` for that service to obtain the current compact tool catalog.
4. Choose a candidate from its name, title and description.
5. Call \`getMcpToolSchema\` for that tool to obtain its full inputSchema.
6. Construct only arguments supported by that schema.
7. Call \`callMcpTool\` with the exact service, toolName and arguments.
8. Read the Gateway response envelope:
   - If \`mode = complete\`, use \`data\`.
   - If \`mode = chunked\`, keep \`transfer.id\`, read \`chunk\`, then call \`getGatewayResponseChunk\` with \`transfer.nextChunkIndex\` until \`hasMore = false\`.
9. For chunked responses, process chunks in \`chunkIndex\` order. Each \`chunk\` is a consecutive fragment of one serialized JSON document; never assume the first chunk is the full result.
10. After retrieving enough required data, synthesize the answer for the user.

## Rules

- Gateway is the mandatory execution boundary. Never bypass it by calling the MCP provider directly.
- Never ask for, expose, or forward provider API keys.
- Do not permanently hardcode Stitch tool names; runtime discovery is authoritative.
- On \`MCP_NOT_CONNECTED\`, tell the user to connect that provider in the MCP Gateway app.
- On \`OPEN_ID_REQUIRED\`, tell the user an active Open ID or trial is required. Do not bypass the entitlement.
- \`listMcpTools\` is intentionally compact; always fetch the selected tool with \`getMcpToolSchema\` before calling it.
- If a selected tool does not fit, refresh \`listMcpTools\` and choose again rather than inventing an endpoint.
- Every successful GPT-facing response uses a \`complete\` or \`chunked\` envelope.
- On \`mode = chunked\`, continue with \`getGatewayResponseChunk\`; do not tell the user data is missing merely because the first response was partial.
- Response transfers are short-lived. Fetch required continuation chunks during the same workflow.
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
- **Gateway response envelope**: every successful GPT action returns either \`mode: complete\` with \`data\`, or \`mode: chunked\` with a response fragment and continuation metadata.
- **Response transfer**: short-lived encrypted server-side storage used only when a serialized action response would exceed the configured safe response budget.

## Routing syntax

\`\`\`
Intent
  -> Capability
  -> MCP Service
  -> listMcpTools(service)
  -> select tool candidate
  -> getMcpToolSchema(service, toolName)
  -> callMcpTool(service, toolName, arguments)
  -> if mode=chunked: getGatewayResponseChunk(...) until complete
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
          description: Wrapped Gateway profile
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GatewayActionResponse'
  /gpt/mcp/services:
    get:
      operationId: listMcpServices
      summary: List MCP services supported by Gateway and their connection status.
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Wrapped MCP services
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GatewayActionResponse'
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
          description: Wrapped MCP tool catalog
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GatewayActionResponse'
  /gpt/mcp/{service}/tools/{toolName}:
    get:
      operationId: getMcpToolSchema
      summary: Get the full input schema for one discovered MCP tool.
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
      responses:
        '200':
          description: Wrapped MCP tool definition including inputSchema
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GatewayActionResponse'
  /gpt/responses/{transferId}/chunks/{chunkIndex}:
    get:
      operationId: getGatewayResponseChunk
      summary: Continue an oversized Gateway response one safe chunk at a time.
      description: Use only when a previous Gateway action returned mode=chunked. Fetch nextChunkIndex until hasMore=false.
      security:
        - bearerAuth: []
      parameters:
        - name: transferId
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: chunkIndex
          in: path
          required: true
          schema:
            type: integer
            minimum: 0
      responses:
        '200':
          description: One continuation chunk from the original serialized JSON response
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GatewayChunkedResponse'
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
              $ref: '#/components/schemas/ToolCallRequest'
      responses:
        '200':
          description: Wrapped MCP tool result
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GatewayActionResponse'
components:
  schemas:
    GatewayActionResponse:
      oneOf:
        - $ref: '#/components/schemas/GatewayCompleteResponse'
        - $ref: '#/components/schemas/GatewayChunkedResponse'
    GatewayCompleteResponse:
      type: object
      required: [mode, data]
      properties:
        mode:
          type: string
          const: complete
        data: {}
    GatewayChunkedResponse:
      type: object
      required: [mode, chunk, transfer]
      properties:
        mode:
          type: string
          const: chunked
        chunk:
          type: string
          description: Consecutive fragment of the original serialized JSON response.
        transfer:
          type: object
          required: [id, contentType, totalChunks, totalChars, chunkIndex, hasMore, expiresAt]
          properties:
            id:
              type: string
              format: uuid
            contentType:
              type: string
              const: application/json
            totalChunks:
              type: integer
              minimum: 1
            totalChars:
              type: integer
              minimum: 1
            chunkIndex:
              type: integer
              minimum: 0
            nextChunkIndex:
              anyOf:
                - type: integer
                  minimum: 0
                - type: 'null'
            hasMore:
              type: boolean
            expiresAt:
              type: string
              format: date-time
    ToolCallRequest:
      type: object
      required:
        - arguments
      properties:
        arguments:
          type: object
          additionalProperties: true
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: MCP_GATEWAY_TOKEN
`;
  }
}
