export const PROVIDER_SKILL_IDS = [
  "github",
  "stitch",
  "figma",
  "lovable",
] as const;

export type ProviderSkillId = (typeof PROVIDER_SKILL_IDS)[number];

export const PROVIDER_SKILL_OPTIONS: Array<{
  id: ProviderSkillId;
  filename: string;
  label: string;
  description: { vi: string; en: string };
}> = [
  {
    id: "github",
    filename: "GPTS-MCP-GATEWAY-Skill-GitHub.md",
    label: "GitHub",
    description: {
      vi: "Source/repo, code search, PR, issue, Actions và read/write workflow.",
      en: "Source/repo, code search, PRs, issues, Actions, and read/write workflow.",
    },
  },
  {
    id: "stitch",
    filename: "GPTS-MCP-GATEWAY-Skill-Stitch.md",
    label: "Stitch",
    description: {
      vi: "Screen generation/edit, variants, design system và design-to-code.",
      en: "Screen generation/editing, variants, design systems, and design-to-code.",
    },
  },
  {
    id: "figma",
    filename: "GPTS-MCP-GATEWAY-Skill-Figma.md",
    label: "Figma",
    description: {
      vi: "Design context, design-to-code, write-to-canvas, tokens/components.",
      en: "Design context, design-to-code, write-to-canvas, tokens/components.",
    },
  },
  {
    id: "lovable",
    filename: "GPTS-MCP-GATEWAY-Skill-Lovable.md",
    label: "Lovable",
    description: {
      vi: "Create/iterate app, code inspection, database, skills và deploy.",
      en: "Create/iterate apps, inspect code, database, skills, and deployment.",
    },
  },
];
