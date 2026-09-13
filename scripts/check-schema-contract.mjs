import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const migrationDir = path.join(root, "database", "migrations");
const sql = fs.readdirSync(migrationDir)
  .filter((name) => name.endsWith(".sql"))
  .sort()
  .map((name) => fs.readFileSync(path.join(migrationDir, name), "utf8"))
  .join("\n")
  .toLowerCase();

const required = [
  "create table public.app_users",
  "create table public.mcp_connections",
  "create table public.open_ids",
  "create table public.gateway_credentials",
  "create table public.trial_entitlements",
  "create table public.gpt_response_transfers",
  "create table public.gpt_response_chunks",
  "create table public.mcp_oauth_transactions",
  "alter table public.mcp_oauth_transactions enable row level security",
  "revoke all on table public.mcp_oauth_transactions from anon, authenticated",
  "create or replace function public.claim_gateway_trial",
  "unique (user_id, provider)"
];

const missing = required.filter((needle) => !sql.includes(needle));
if (missing.length) {
  console.error("schema contract missing:", missing);
  process.exit(1);
}

if (!sql.includes("trial_claimed_at")) {
  console.error("schema must persist lifetime trial claim state");
  process.exit(1);
}

console.log("schema contract ok");
