import type { ProviderSkillFile } from '@server/root/modules/gpt-integration/provider-skills/provider-skill.types';

export const stitchSkill: ProviderSkillFile = {
  id: 'stitch',
  filename: 'GPTS-MCP-GATEWAY-Skill-Stitch.md',
  content: (language) =>
    language === 'vi'
      ? `# Google Stitch MCP Skill

Provider ID: \`stitch\`

## Khi nào dùng

Dùng Stitch khi user muốn tạo/chỉnh UI screen, variant, design system, xem Stitch project/screen, đối chiếu design với source hoặc đưa design Stitch vào code.

URL/project ID/screen ID Stitch là tín hiệu mạnh để chọn provider này.

## Workflow đọc / đối chiếu

1. Resolve đúng project trước.
2. Lấy danh sách/current screen và design system hiện có.
3. Đọc screen hiện tại trước khi edit; không dựa vào generation cũ nếu screen đã được cập nhật.
4. Khi implement vào code, phân biệt rõ layout/composition, typography/tokens, component states, responsive/mobile, motion/animation và business behavior cần giữ nguyên.
5. Sau mutation quan trọng, fetch lại project/screen để đối chiếu source-of-truth mới nhất.

## Generate / Edit

- Nếu project đã có design system, reuse tokens/system đó thay vì nhét màu/font/theme tùy ý vào prompt.
- Edit screen hiện có khi yêu cầu là chỉnh sửa; không regenerate screen mới chỉ để né edit.
- Với variants, giữ invariant business/content mà user không yêu cầu thay đổi.
- Prompt generation phải cụ thể về hierarchy, layout, states, responsive và motion; tránh từ mơ hồ kiểu "đẹp hơn".
- Generation/edit có thể chạy lâu; không bắn duplicate request chỉ vì chưa có kết quả ngay.

## Design-to-code

Stitch là visual source; **current application source vẫn là authority cho business logic**. Khi cập nhật code:
- giữ API/state/permission/validation/side effects nếu user chỉ yêu cầu UI;
- không claim pixel parity nếu chưa xem actual screen/screenshot;
- ưu tiên semantic design tokens và reusable presentation components.

## Safety

Hỏi trước khi delete project/screen, thay design system diện rộng hoặc thực hiện thay đổi khó hoàn tác.

## Runtime rule

Không hardcode tool name. Discover capability hiện tại qua
\`listMcpTools("stitch")\` → schema → call.
`
      : `# Google Stitch MCP Skill

Provider ID: \`stitch\`

## Trigger

Use Stitch when the user wants to create/edit UI screens, variants or design systems, inspect a Stitch project/screen, compare design with source, or implement a Stitch design in code.

A Stitch URL, project ID, or screen ID is a strong routing signal.

## Read / compare workflow

1. Resolve the correct project first.
2. Inspect current screens and the active design system.
3. Read the current screen before editing; never treat an older generation as authoritative after the design changed.
4. For design-to-code, distinguish layout/composition, typography/tokens, component states, responsive/mobile behavior, motion/animation, and business behavior that must remain unchanged.
5. Re-fetch project/screen state after important provider mutations when validation matters.

## Generate / Edit

- Reuse the project design system when one exists instead of restating arbitrary colors/fonts/themes.
- Edit an existing screen for edit requests; do not generate a new screen merely to avoid editing.
- Preserve business/content invariants across variants unless the user asked to change them.
- Generation prompts should specify hierarchy, layout, states, responsive behavior, and motion instead of vague phrases such as "make it nicer".
- Generation/edit calls may take time; do not fire duplicate requests just because a long-running call has not completed yet.

## Design-to-code

Stitch is the visual source; **current application source remains authoritative for business logic**. When changing code:
- preserve APIs/state/permissions/validation/side effects for UI-only requests;
- never claim pixel parity without inspecting the actual current screen/screenshot;
- prefer semantic design tokens and reusable presentation components.

## Safety

Ask before deleting projects/screens, replacing a design system broadly, or making hard-to-reverse changes.

## Runtime rule

Never hardcode tool names. Discover current capabilities through
\`listMcpTools("stitch")\` → schema → call.
`,
};
