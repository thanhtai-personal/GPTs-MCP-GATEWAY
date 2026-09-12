export const PROVIDER_SKILL_IDS = [
  'github',
  'stitch',
  'figma',
  'lovable',
  'google-docs',
  'google-sheets',
] as const;

export type ProviderSkillId = (typeof PROVIDER_SKILL_IDS)[number];

export type ProviderSkillFile = {
  id: ProviderSkillId;
  filename: string;
  content: (language: 'vi' | 'en') => string;
};
