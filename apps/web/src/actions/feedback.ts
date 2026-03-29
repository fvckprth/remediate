"use server";

import { auth } from "@/auth";
import { db } from "@/db";
import { feedback, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deleteFeedback(feedbackId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Fetch feedback to get projectId
  const [entry] = await db
    .select({ projectId: feedback.projectId })
    .from(feedback)
    .where(eq(feedback.id, feedbackId))
    .limit(1);

  if (!entry) throw new Error("Feedback not found");

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, entry.projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) throw new Error("Not authorized");

  // feedbackItems cascade-deletes automatically
  await db.delete(feedback).where(eq(feedback.id, feedbackId));

  revalidatePath(`/dashboard/projects/${entry.projectId}`);
  redirect(`/dashboard/projects/${entry.projectId}`);
}
