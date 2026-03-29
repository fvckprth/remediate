"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = (formData.get("name") as string)?.trim();
  if (!name) throw new Error("Project name is required");

  const id = `proj_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  await db.insert(projects).values({ id, name, userId: session.user.id });

  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${id}`);
}

export async function updateProject(projectId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const name = (formData.get("name") as string)?.trim();
  const webhookUrl = (formData.get("webhookUrl") as string)?.trim() || null;

  if (!name) throw new Error("Project name is required");

  await db
    .update(projects)
    .set({ name, webhookUrl })
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)));

  revalidatePath(`/dashboard/projects/${projectId}/settings`);
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath("/dashboard");
}

export async function deleteProject(projectId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)));

  revalidatePath("/dashboard");
  redirect("/dashboard");
}
