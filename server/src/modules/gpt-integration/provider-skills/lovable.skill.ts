import type { ProviderSkillFile } from '@server/root/modules/gpt-integration/provider-skills/provider-skill.types';

export const lovableSkill: ProviderSkillFile = {
  id: 'lovable',
  filename: 'GPTS-MCP-GATEWAY-Skill-Lovable.md',
  content: (language) =>
    language === 'vi'
      ? `# Lovable MCP Skill

Provider ID: \`lovable\`

Lovable publish skill chính thức cho MCP; skill Gateway này giữ cùng workflow intent nhưng luôn discovery tool/schema qua Gateway.

## Khi nào dùng

Ưu tiên Lovable khi user muốn:
- tạo app/project mới từ prompt;
- iterate project hiện có;
- inspect files/diffs/edit history;
- quản lý project/workspace knowledge hoặc skills;
- dùng Lovable Cloud database;
- quản lý connectors;
- xem analytics hoặc deploy/publish project.

## Project workflow

1. Resolve workspace/project trước khi mutate.
2. Với project mới, tạo từ requirement đủ cụ thể; sau đó lấy project/preview state.
3. Với iteration, gửi thay đổi vào đúng project và chờ/poll đến khi build hoàn tất nếu provider trả async state.
4. Sau edit, inspect diff/files/current project khi correctness quan trọng.
5. Không deploy mặc định. Chỉ publish/deploy khi user yêu cầu rõ.

## Code inspection

Khi user muốn review/debug Lovable project, ưu tiên đọc file tree/file content/diff/edit history trước khi yêu cầu copy source ra ngoài.

## Database

Database query có thể read, write và schema change:
- SELECT/read theo intent bình thường;
- write/schema/drop/destructive cần intent rõ;
- hỏi trước thao tác destructive hoặc irreversible;
- không chạy SQL rộng hơn phạm vi cần thiết.

## Knowledge / Skills / Connectors

- Workspace/project knowledge có thể replace toàn bộ nội dung; đọc hiện trạng trước khi overwrite.
- Delete skill/connector là destructive; cần confirmation.
- Nếu provider yêu cầu user hoàn tất connector qua Lovable UI, đưa user tới flow đó thay vì tự giả lập credential.

## Credits / live effects

Project generation/message calls có thể tốn Lovable credits và tool calls chạy trên account thật. Tránh duplicate build/message calls.

## Runtime rule

Không hardcode tool names dù Lovable có machine-readable skill riêng; Gateway runtime là authority:
\`listMcpTools("lovable")\` → schema → call.
`
      : `# Lovable MCP Skill

Provider ID: \`lovable\`

Lovable publishes an official MCP skill; this Gateway skill preserves the same workflow intent while always discovering tools/schemas through Gateway.

## Trigger

Prefer Lovable when the user wants to:
- create a new app/project from a prompt;
- iterate on an existing project;
- inspect files/diffs/edit history;
- manage project/workspace knowledge or skills;
- work with Lovable Cloud database;
- manage connectors;
- inspect analytics or deploy/publish a project.

## Project workflow

1. Resolve the workspace/project before mutating.
2. For a new project, create from sufficiently concrete requirements, then obtain current project/preview state.
3. For iteration, send the requested change to the correct project and wait/poll for completion when the provider returns asynchronous state.
4. After edits, inspect diffs/files/current project state when correctness matters.
5. Do not deploy by default. Publish/deploy only with explicit user intent.

## Code inspection

For Lovable review/debug tasks, prefer reading the project tree/files/diffs/edit history before asking the user to export source elsewhere.

## Database

Database queries can read, write, and change schema:
- normal SELECT/read follows user intent;
- writes/schema/drop/destructive operations require clear intent;
- ask before destructive or irreversible operations;
- never execute broader SQL than the task needs.

## Knowledge / Skills / Connectors

- Workspace/project knowledge updates may replace the entire value; read current state before overwriting.
- Deleting skills/connectors is destructive and requires confirmation.
- If provider flow requires the user to finish connector setup in Lovable UI, route them there instead of inventing credential handling.

## Credits / live effects

Project generation/message calls can consume Lovable credits and tool calls affect the real account. Avoid duplicate build/message calls.

## Runtime rule

Never hardcode tool names even though Lovable maintains a machine-readable provider skill; Gateway runtime is authoritative:
\`listMcpTools("lovable")\` → schema → call.
`,
};
