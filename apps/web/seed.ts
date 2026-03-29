import { neon } from "@neondatabase/serverless";
import { createHash, randomBytes } from "crypto";

async function main() {
  const sql = neon(process.env.DATABASE_URL as string);

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
