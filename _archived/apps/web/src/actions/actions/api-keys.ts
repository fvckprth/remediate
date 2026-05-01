"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { apiKeys, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createHash, randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

export async function createApiKey(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) throw new Error("Project not found");

  const rawKey = `pk_${randomBytes(16).toString("hex")}`;
  const keyHash = createHash("sha256").update(rawKey).digest("hex");
  const keyPrefix = rawKey.slice(0, 7);
  const id = `key_${randomBytes(8).toString("hex")}`;

  await db.insert(apiKeys).values({ id, projectId, keyHash, keyPrefix });

  revalidatePath(`/dashboard/projects/${projectId}/settings`);

  return { rawKey };
}

export async function revokeApiKey(keyId: string, projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) throw new Error("Project not found");

  await db
    .delete(apiKeys)
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.projectId, projectId)));

  revalidatePath(`/dashboard/projects/${projectId}/settings`);
}
