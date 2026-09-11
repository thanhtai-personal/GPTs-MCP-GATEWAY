import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const migrationPath = path.join(root, "database", "migrations", "001_initial_schema.sql");
const sql = fs.readFileSync(migrationPath, "utf8").toLowerCase();

const required = [
  "create table public.app_users",
  "create table public.mcp_connections",
  "create table public.open_ids",
  "create table public.gateway_credentials",
  "create table public.trial_entitlements",
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
