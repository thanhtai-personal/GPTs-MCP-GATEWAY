import type { ProviderSkillFile } from '@server/root/modules/gpt-integration/provider-skills/provider-skill.types';

export const figmaSkill: ProviderSkillFile = {
  id: 'figma',
  filename: 'GPTS-MCP-GATEWAY-Skill-Figma.md',
  content: (language) =>
    language === 'vi'
      ? `# Figma MCP Skill

Provider ID: \`figma\`

Skill này tổng hợp workflow phù hợp từ các Figma MCP skills chính thức nhưng vẫn dùng runtime discovery của Gateway.

## Khi nào dùng

Ưu tiên Figma khi task có Figma URL/file/node ID hoặc user muốn:
- implement design Figma thành code;
- đọc screenshot/design context/variables/assets;
- tạo/chỉnh node, component, variants, auto-layout, variables/tokens;
- tạo file/design/diagram;
- xây hoặc reconcile design system.

## Design → Code

1. Resolve đúng file/node/selection.
2. Lấy design context và visual evidence phù hợp trước khi code.
3. Lấy variables/assets/design-system context nếu chúng ảnh hưởng implementation.
4. Map Figma semantics vào stack/components/tokens thật của codebase; không generate generic HTML nếu project đã có architecture.
5. Preserve business logic hiện tại trừ khi yêu cầu đổi behavior.
6. Validate responsive states và visual hierarchy, không chỉ desktop screenshot.

## Write to Figma

- Cần edit access.
- Inspect file/design system trước khi tạo component/page lớn.
- Reuse components, variables và styles có sẵn trước khi hardcode raw values.
- Thực hiện thay đổi theo từng cụm có thể kiểm tra; đọc lại kết quả sau mutation quan trọng.
- Khi tạo design system, xây foundations/tokens trước component variants nếu task cần chất lượng production.
- Khi tạo diagram, chọn đúng diagram type và giữ syntax/structure đơn giản để render ổn định.

## New file / target selection

Nếu cần file mới, resolve editor type và tên file trước. Nếu user đã chỉ định file/selection, không tự tạo file mới.

## Runtime rule

Figma MCP thay đổi nhanh và quyền có thể read-only tùy seat/file. Không giả định capability hoặc tool name.
Luôn dùng \`listMcpTools("figma")\` → schema → call.
`
      : `# Figma MCP Skill

Provider ID: \`figma\`

This skill consolidates workflow principles from Figma's official MCP skills while preserving Gateway runtime discovery.

## Trigger

Prefer Figma when a task contains a Figma URL/file/node ID or the user wants to:
- implement a Figma design as code;
- fetch screenshots/design context/variables/assets;
- create or edit nodes, components, variants, auto-layout, variables/tokens;
- create files/designs/diagrams;
- build or reconcile a design system.

## Design → Code

1. Resolve the exact file/node/selection.
2. Fetch appropriate design context and visual evidence before coding.
3. Fetch variables/assets/design-system context when they affect implementation.
4. Map Figma semantics into the real codebase stack/components/tokens; do not fall back to generic HTML when project architecture exists.
5. Preserve current business logic unless behavior changes were requested.
6. Validate responsive states and visual hierarchy, not only one desktop screenshot.

## Write to Figma

- Edit access is required.
- Inspect the file/design system before creating large components or pages.
- Reuse existing components, variables, and styles before hardcoding raw values.
- Work in reviewable increments and inspect results after important mutations.
- For production design systems, establish foundations/tokens before broad component variants when the task requires it.
- For diagrams, select the correct diagram type and keep the structure simple enough to render reliably.

## New file / target selection

When a new file is required, resolve editor type and file name first. If the user already supplied a file or selection, do not create a new file unnecessarily.

## Runtime rule

Figma MCP evolves quickly and permissions may be read-only depending on seat/file access. Never assume capabilities or tool names.
Always use \`listMcpTools("figma")\` → schema → call.
`,
};
