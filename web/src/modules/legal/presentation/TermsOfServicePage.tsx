import { LegalPage } from "@/modules/legal/presentation/LegalPage";

const sections = [
  {
    title: "1. Service",
    paragraphs: [
      "MCP Gateway provides a control plane that allows authorized Custom GPTs to discover and invoke supported MCP services through Gateway. Available providers, tools, and capabilities may change over time.",
      "Third-party MCP services are operated by their respective providers and may be unavailable, restricted, rate-limited, changed, or discontinued independently of MCP Gateway.",
    ],
  },
  {
    title: "2. Accounts and authorization",
    bullets: [
      "You are responsible for activity performed through your account and for keeping exported Gateway credentials secure.",
      "You may connect only provider accounts and resources that you are authorized to access.",
      "You must not bypass Open ID entitlement checks, provider permission controls, OAuth consent, or other Gateway security boundaries.",
      "If an account or entitlement is suspended, revoked, expired, or otherwise inactive, MCP execution may be denied.",
    ],
  },
  {
    title: "3. Trial and Open ID",
    paragraphs: [
      "The current product supports one seven-day trial per eligible account. The trial begins only when the user explicitly creates the trial token, not merely by registering or configuring providers.",
      "Trial and paid Open ID entitlements may have different exportability, expiry, or access characteristics as shown in the application.",
    ],
  },
  {
    title: "4. Provider permissions and write actions",
    paragraphs: [
      "Some providers expose read and write operations. You are responsible for choosing appropriate permissions and reviewing destructive, irreversible, publishing, merge, delete, schema-changing, or other sensitive actions before execution.",
      "When a provider is connected in a read-only mode, you may not use the service to bypass that restriction.",
    ],
  },
  {
    title: "5. Acceptable use",
    bullets: [
      "Do not use MCP Gateway to gain unauthorized access to systems, accounts, repositories, documents, databases, or other resources.",
      "Do not use the service to distribute malware, steal credentials, evade provider controls, or interfere with Gateway or connected providers.",
      "Do not intentionally submit abusive traffic or attempt to defeat rate limits, authorization, audit, or security controls.",
      "You remain responsible for complying with the terms and policies of each connected third-party provider.",
    ],
  },
  {
    title: "6. User content and provider data",
    paragraphs: [
      "You retain responsibility for source code, documents, spreadsheets, designs, prompts, data, and other content you access or modify through connected services.",
      "MCP Gateway processes provider data only as needed to perform the requested Gateway workflow, subject to the Privacy Policy and provider authorization granted by the user.",
    ],
  },
  {
    title: "7. Preview and beta services",
    paragraphs: [
      "Some MCP providers or capabilities may be beta, Developer Preview, experimental, or provider-restricted. Their use may require separate provider approval, enrollment, or project configuration.",
      "Pre-GA Google Workspace MCP features are subject to Google's Developer Preview Program terms and may not be made available to public end users unless Google permits that use.",
    ],
  },
  {
    title: "8. Availability and validation",
    paragraphs: [
      "The service may be updated, limited, suspended, or interrupted for maintenance, security, provider changes, or operational reasons.",
      "MCP Gateway does not guarantee that an AI-generated tool selection, code change, document edit, spreadsheet update, or other provider action is correct. High-impact actions should be reviewed and resulting changes validated.",
    ],
  },
  {
    title: "9. Disclaimer",
    paragraphs: [
      "The service is provided on an as-available basis. To the maximum extent permitted by applicable law, MCP Gateway makes no guarantee that every provider, tool, integration, or generated result will be uninterrupted, error-free, or suitable for a particular purpose.",
    ],
  },
  {
    title: "10. Changes",
    paragraphs: [
      "These terms may be updated as the product, supported MCP providers, entitlement model, or operational requirements change. The published date identifies the current version.",
    ],
  },
];

export function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="SERVICE TERMS"
      sections={sections}
      summary="Rules for using MCP Gateway, Open ID entitlements, provider connections, and MCP execution capabilities."
      title="Terms of Service"
      updatedAt="September 12, 2026"
    />
  );
}
