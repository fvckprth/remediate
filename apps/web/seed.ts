import { config } from "dotenv";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes } from "crypto";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("Missing DATABASE_URL. Set it in .env.local or .env in apps/web.");
    process.exit(1);
  }
  const sql = neon(databaseUrl);

  const projectId = "proj_" + randomBytes(8).toString("hex");
  const rawKey = "pk_" + randomBytes(16).toString("hex");
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 7);
  const apiKeyId = "key_" + randomBytes(8).toString("hex");

  await sql`INSERT INTO projects (id, name) VALUES (${projectId}, 'Test Project')`;
  await sql`INSERT INTO api_keys (id, project_id, key_hash, key_prefix) VALUES (${apiKeyId}, ${projectId}, ${keyHash}, ${keyPrefix})`;

  console.log("Project ID:", projectId);
  console.log("API Key ID:", apiKeyId);
  console.log("Raw API Key (save this!):", rawKey);
  console.log("Key prefix:", keyPrefix);
}

main();
