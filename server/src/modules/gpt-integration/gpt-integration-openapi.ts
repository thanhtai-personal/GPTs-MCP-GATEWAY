export function buildGptOpenApiSchema(server: string): string {
  return `openapi: 3.1.0
info:
  title: MCP Gateway Actions
  version: 1.3.0
  description: Discover Gateway skills and call user-authorized MCP services through MCP Gateway. Use runtime discovery before concluding that an external account or resource is unavailable.
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
  /gpt/skills:
    get:
      operationId: listGatewaySkills
      summary: List provider workflow skills built into Gateway.
      description: Discover provider-specific guidance that can be fetched on demand instead of uploaded into GPT Knowledge.
      security:
        - bearerAuth: []
      responses:
        '200':
          description: Wrapped Gateway skill catalog
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GatewayActionResponse'
  /gpt/skills/{skillId}:
    get:
      operationId: getGatewaySkill
      summary: Fetch one provider workflow skill from Gateway.
      description: Fetch only a skill ID returned by listGatewaySkills. Runtime MCP tool discovery remains authoritative.
      security:
        - bearerAuth: []
      parameters:
        - name: skillId
          in: path
          required: true
          schema:
            type: string
        - name: language
          in: query
          required: false
          schema:
            type: string
            enum: [en, vi]
            default: en
      responses:
        '200':
          description: Wrapped Gateway skill content
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/GatewayActionResponse'
  /gpt/mcp/services:
    get:
      operationId: listMcpServices
      summary: List MCP services supported by Gateway and their connection status.
      description: Use this to discover the exact runtime provider IDs before selecting a service. Examples may include github and notion, but the returned list is authoritative.
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
      description: Pass the exact service ID returned by listMcpServices. Do not assume provider tool names; read-only connections may omit write tools.
      security:
        - bearerAuth: []
      parameters:
        - name: service
          in: path
          required: true
          description: Exact runtime provider ID returned by listMcpServices.
          schema:
            type: string
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
      description: Use only a tool name returned by listMcpTools for the selected runtime service.
      security:
        - bearerAuth: []
      parameters:
        - name: service
          in: path
          required: true
          schema:
            type: string
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
      summary: Execute one discovered MCP tool through Gateway using generic JSON arguments.
      description: Execute only after runtime tool discovery and schema inspection. Provider permissions remain enforced by Gateway/provider runtime.
      security:
        - bearerAuth: []
      parameters:
        - name: service
          in: path
          required: true
          schema:
            type: string
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
      required: [argumentsJson]
      properties:
        argumentsJson:
          type: string
          description: JSON-serialized MCP tool argument object. Use {} when the tool takes no arguments. Nested JSON values are allowed exactly as defined by the discovered tool inputSchema.
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: MCP_GATEWAY_TOKEN
`;
}
