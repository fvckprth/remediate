import { auth } from "@/auth";
import { db } from "@/db";
import { projects, feedback } from "@/db/schema";
import { eq, count, desc } from "drizzle-orm";
import { Header } from "@/components/layout/header";
import { EmptyState } from "@/components/ui/empty-state";
import { CreateProjectButton } from "./create-project-button";
import { RelativeTime } from "@/components/ui/relative-time";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userProjects = await db
    .select({
      id: projects.id,
      name: projects.name,
      createdAt: projects.createdAt,
      feedbackCount: count(feedback.id),
    })
    .from(projects)
    .leftJoin(feedback, eq(feedback.projectId, projects.id))
    .where(eq(projects.userId, session.user.id))
    .groupBy(projects.id)
    .orderBy(desc(projects.createdAt));

  return (
    <>
      <Header title="Projects" action={<CreateProjectButton />} />
      <div className="p-8">
        {userProjects.length === 0 ? (
          <EmptyState
            title="No projects yet"
            description="Create your first project to start collecting feedback."
            action={<CreateProjectButton />}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userProjects.map((project) => (
              <Link
                key={project.id}
                href={`/dashboard/projects/${project.id}`}
                className="rounded-xl border border-border p-5 hover:bg-surface transition-colors"
              >
                <p className="font-bold">{project.name}</p>
                <p className="mt-2 text-sm text-muted">
                  {project.feedbackCount} feedback{project.feedbackCount !== 1 ? "s" : ""}
                </p>
                <p className="mt-1 text-xs text-muted">
                  Created <RelativeTime date={project.createdAt} />
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
