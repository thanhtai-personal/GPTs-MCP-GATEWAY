import { figmaSkill } from '@server/root/modules/gpt-integration/provider-skills/figma.skill';
import { githubSkill } from '@server/root/modules/gpt-integration/provider-skills/github.skill';
import { googleDriveSkill } from '@server/root/modules/gpt-integration/provider-skills/google-drive.skill';
import { googleDocsSkill } from '@server/root/modules/gpt-integration/provider-skills/google-docs.skill';
import { googleSheetsSkill } from '@server/root/modules/gpt-integration/provider-skills/google-sheets.skill';
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
  'google-drive': googleDriveSkill,
  'google-docs': googleDocsSkill,
  'google-sheets': googleSheetsSkill,
};

export function providerSkills() {
  return PROVIDER_SKILL_IDS.map((id) => SKILLS[id]);
}

export function getProviderSkill(id: string) {
  return PROVIDER_SKILL_IDS.includes(id as ProviderSkillId)
    ? SKILLS[id as ProviderSkillId]
    : undefined;
}
