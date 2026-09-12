import { figmaSkill } from '@server/root/modules/gpt-integration/provider-skills/figma.skill';
import { githubSkill } from '@server/root/modules/gpt-integration/provider-skills/github.skill';
import { lovableSkill } from '@server/root/modules/gpt-integration/provider-skills/lovable.skill';
import {
  PROVIDER_SKILL_IDS,
  type ProviderSkillFile,
  type ProviderSkillId,
} from '@server/root/modules/gpt-integration/provider-skills/provider-skill.types';
import { stitchSkill } from '@server/root/modules/gpt-integration/provider-skills/stitch.skill';

const SKILLS: Record<ProviderSkillId, ProviderSkillFile> = {
  github: githubSkill,
  stitch: stitchSkill,
  figma: figmaSkill,
  lovable: lovableSkill,
};

export function parseProviderSkills(raw?: string): ProviderSkillId[] {
  if (!raw?.trim()) return [];

  const requested = new Set(
    raw
      .split(',')
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean),
  );

  return PROVIDER_SKILL_IDS.filter((id) => requested.has(id));
}

export function providerSkillFiles(ids: ProviderSkillId[]) {
  return ids.map((id) => SKILLS[id]);
}
