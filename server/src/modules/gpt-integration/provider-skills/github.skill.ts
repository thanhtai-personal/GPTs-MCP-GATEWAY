import type { ProviderSkillFile } from '@server/root/modules/gpt-integration/provider-skills/provider-skill.types';

export const githubSkill: ProviderSkillFile = {
  id: 'github',
  filename: 'GPTS-MCP-GATEWAY-Skill-GitHub.md',
  content: (language) =>
    language === 'vi'
      ? `# GitHub MCP Skill

Provider ID: \`github\`

## Khi nào dùng

Ưu tiên GitHub khi user muốn đọc/search source, hiểu repository, tìm implementation, trace bug, kiểm tra branch/commit/PR/issue/release/Actions, review thay đổi hoặc thực hiện một GitHub action rõ ràng.

Nếu user nói "đọc source", "xem repo", "tìm code", "review PR" hoặc tương tự, kiểm tra GitHub qua Gateway trước khi yêu cầu upload ZIP.

## Workflow

1. Xác nhận đúng repository và ref/branch/PR context từ user hoặc runtime data.
2. Discover tool catalog ở runtime; không giả định tên tool.
3. Với code investigation: search hẹp trước, đọc file hiện tại, lần theo imports/callers/dependencies cần thiết, rồi mới kết luận.
4. Với PR/issue/Actions: lấy trạng thái hiện tại trước khi đề xuất hoặc mutate.
5. Nếu response lớn/chunked, lấy đủ chunks trước khi phân tích.

## Read / Write

GitHub Gateway mặc định là **Read only**. Khi runtime không expose write tool, không tìm cách bypass.

Nếu user yêu cầu ghi nhưng connection đang Read only:
- nói rõ cần bật **Read + write** trong MCP Gateway;
- reconnect GitHub;
- discovery lại tools trước khi tiếp tục.

Khi Write được bật:
- chỉ mutate khi intent của user rõ ràng;
- **mọi task làm thay đổi source phải dùng branch + Pull Request; tuyệt đối không ghi trực tiếp vào default branch**;
- trước write đầu tiên, xác định default branch và tạo/chọn một non-default branch cho task;
- mọi create/update/delete source file phải target non-default branch đó, không target default branch;
- sau khi hoàn tất thay đổi, mở PR từ task branch về default branch và trả PR cho user;
- không merge PR nếu user chưa yêu cầu merge riêng;
- nếu runtime không có capability tạo branch hoặc PR, dừng trước khi ghi source và báo hard blocker thay vì fallback sang default-branch write;
- hỏi trước các hành động phá hủy, merge, delete, force/update nhạy cảm hoặc thay đổi scope lớn;
- không tự mở rộng task thành refactor/rewrite ngoài yêu cầu.

### Invariant cho coding task

Flow bắt buộc là:
\`đọc source/default branch → tạo task branch → ghi/commit vào task branch → review/validate → tạo PR về default branch\`.

Một coding task chưa được coi là hoàn tất nếu source đã thay đổi nhưng chưa có PR, trừ khi user chỉ yêu cầu tạo patch/draft và không yêu cầu ghi repository.

## Source-first coding

Source hiện tại là authority. Đọc file liên quan trước khi đề xuất patch. Không claim build/test/pass nếu chưa thực sự chạy hoặc chưa có evidence từ GitHub/CI.

## Runtime rule

Skill này định tuyến intent và workflow; **tool names, schemas và capabilities thực tế luôn lấy từ**:
\`listMcpTools("github")\` → \`getMcpToolSchema\` → \`callMcpTool\`.
`
      : `# GitHub MCP Skill

Provider ID: \`github\`

## Trigger

Prefer GitHub when the user wants to inspect/search source, understand a repository, find an implementation, trace a bug, inspect branches/commits/PRs/issues/releases/Actions, review changes, or perform an explicit GitHub action.

For requests such as "read my source", "inspect this repo", "find the code", or "review this PR", check GitHub through Gateway before asking for a ZIP upload.

## Workflow

1. Resolve the repository and ref/branch/PR context from the user or runtime data.
2. Discover the current tool catalog; never assume tool names.
3. For code investigation, search narrowly first, read current files, trace only the required imports/callers/dependencies, then conclude.
4. For PRs/issues/Actions, read current state before proposing or mutating anything.
5. Fetch every continuation chunk before analyzing oversized results.

## Read / Write

GitHub Gateway defaults to **Read only**. If runtime discovery exposes no write capability, never bypass it.

When the user requests a write action while read-only:
- tell them to enable **Read + write** in MCP Gateway;
- reconnect GitHub;
- rediscover tools before continuing.

When Write is enabled:
- mutate only with clear user intent;
- **every task that changes source must use a branch + Pull Request; never write directly to the default branch**;
- before the first write, resolve the default branch and create/select a non-default task branch;
- every source create/update/delete operation must target that non-default branch, never the default branch;
- after the changes are complete, open a PR from the task branch into the default branch and return the PR to the user;
- do not merge the PR unless the user separately asks to merge it;
- if runtime lacks branch-creation or PR-creation capability, stop before writing source and report a hard blocker instead of falling back to a default-branch write;
- ask first for destructive actions, merge/delete/force operations, or broad irreversible changes;
- do not expand a scoped request into unrelated rewrites.

### Coding-task invariant

The required flow is:
\`read source/default branch → create task branch → write/commit on task branch → review/validate → create PR into default branch\`.

A coding task is not complete when repository source changed without a PR, unless the user only requested a patch/draft and did not ask for repository writes.

## Source-first coding

Current source is authoritative. Read relevant files before proposing patches. Never claim a build/test/check passed without actual evidence.

## Runtime rule

This skill routes intent and workflow; **actual tool names, schemas, and capabilities always come from**:
\`listMcpTools("github")\` → \`getMcpToolSchema\` → \`callMcpTool\`.
`,
};
