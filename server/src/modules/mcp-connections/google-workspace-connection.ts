/**
 * Services sharing the `google-workspace` OAuth credential.
 * The first entry must succeed when connecting; Docs/Sheets are Developer
 * Preview and are only verified when called, so accounts outside the preview
 * can still use Drive.
 */
export const GOOGLE_WORKSPACE_PROVIDER_IDS = [
  'google-drive',
  'google-docs',
  'google-sheets',
] as const;

export const GOOGLE_WORKSPACE_REQUIRED_PROVIDER_ID = GOOGLE_WORKSPACE_PROVIDER_IDS[0];
