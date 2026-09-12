import { LegalPage } from "@/modules/legal/presentation/LegalPage";

const sections = [
  {
    title: "1. Scope",
    paragraphs: [
      "This Privacy Policy applies to MCP Gateway at gpts-mcp.vercel.app and explains how the service processes account, entitlement, provider-connection, and MCP execution data.",
      "MCP Gateway acts as a control plane between a user's Custom GPT and user-authorized MCP providers. Third-party providers remain subject to their own privacy policies and terms.",
    ],
  },
  {
    title: "2. Information we process",
    bullets: [
      "Account data such as user ID, email address, display name, account role, membership tier, and account status.",
      "Entitlement data such as trial state, Open ID records, Gateway credential labels, token hashes/prefixes, expiry, revocation, and last-used metadata.",
      "Provider connection data such as provider name, connection status, verification timestamps, and encrypted OAuth access/refresh tokens or API keys.",
      "Operational audit data such as provider, operation name, success/failure status, error code, duration, and limited service metadata.",
      "MCP request and response data required to perform a requested operation. Oversized response chunks may be stored temporarily in encrypted form until their configured expiry.",
    ],
  },
  {
    title: "3. How we use information",
    bullets: [
      "Authenticate users and maintain account state.",
      "Create and enforce trial or paid Open ID entitlements.",
      "Connect to MCP providers selected and authorized by the user.",
      "Discover MCP tools and execute user-requested provider actions through Gateway.",
      "Refresh provider OAuth credentials when supported and necessary.",
      "Protect, monitor, troubleshoot, and operate the service.",
    ],
  },
  {
    title: "4. Provider credentials",
    paragraphs: [
      "Provider credentials are stored server-side in encrypted form and are not intentionally placed in Custom GPT instructions, Knowledge files, or ordinary GPT context.",
      "Gateway credentials are stored as hashes rather than reusable plaintext tokens after creation. Users are responsible for keeping any exported Gateway token secret.",
    ],
  },
  {
    title: "5. Google account and Google Workspace data",
    paragraphs: [
      "When a user connects Google Workspace, MCP Gateway may request additional Google OAuth scopes for Google Docs and Google Sheets using the Google account selected during Google's consent flow.",
      "Google OAuth access and refresh tokens are sent to the authenticated Gateway backend and stored as encrypted provider credentials so authorized Google Workspace MCP services can operate on the user's behalf.",
      "MCP Gateway's use and transfer to any other app of information received from Google APIs will adhere to the Google API Services User Data Policy, including the Limited Use requirements.",
      "Users can revoke Google access through their Google account permissions or disconnect Google Workspace in MCP Gateway.",
    ],
  },
  {
    title: "6. Third-party services",
    bullets: [
      "Supabase is used for authentication and application data storage.",
      "Connected MCP providers may include Google Workspace, GitHub, Notion, Figma, Google Stitch, Lovable, and other supported providers.",
      "YouTube's privacy-enhanced embed domain may be used for the optional walkthrough video.",
      "A provider receives the data required for the specific MCP operation the user or authorized GPT requests.",
    ],
  },
  {
    title: "7. Retention and deletion",
    paragraphs: [
      "Account, entitlement, provider-connection, and audit records are retained while needed to provide, secure, and operate the service. Temporary chunked MCP responses expire according to Gateway configuration and are eligible for cleanup after expiry.",
      "Disconnecting an MCP provider removes the saved provider connection credential record for that connection. Revoking a Gateway credential prevents future use of that credential.",
    ],
  },
  {
    title: "8. Security",
    paragraphs: [
      "MCP Gateway uses server-side credential encryption, hashed Gateway credentials, authorization checks, Open ID entitlement enforcement, and provider-specific permission boundaries. No internet service can guarantee absolute security.",
    ],
  },
  {
    title: "9. Your choices",
    bullets: [
      "Choose which MCP providers to connect.",
      "Choose provider permission modes where supported, such as GitHub Read only versus Read + write.",
      "Disconnect providers and revoke third-party OAuth access.",
      "Revoke Gateway credentials where the account interface supports it.",
      "Decline optional provider scopes; doing so may prevent the associated MCP service from working.",
    ],
  },
  {
    title: "10. Policy changes",
    paragraphs: [
      "This policy may be updated as MCP Gateway adds providers, changes infrastructure, or introduces new data-processing behavior. The date shown on this page identifies the current published version.",
    ],
  },
];

export function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="PRIVACY & DATA"
      sections={sections}
      summary="How MCP Gateway handles account data, encrypted provider credentials, Google Workspace access, and MCP execution data."
      title="Privacy Policy"
      updatedAt="September 12, 2026"
    />
  );
}
