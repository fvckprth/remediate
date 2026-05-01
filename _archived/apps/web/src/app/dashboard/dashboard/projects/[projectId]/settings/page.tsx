import { auth } from "@/auth";
import { db } from "@/db";
import { projects, apiKeys } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Header } from "@/components/layout/header";
import { ApiKeyManager } from "./api-key-manager";
import { ProjectSettingsForm } from "./project-settings-form";
import { DeleteProjectButton } from "./delete-project-button";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) notFound();

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const appUrl = `${proto}://${host}`;

  const keys = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.projectId, projectId))
    .orderBy(desc(apiKeys.createdAt));

  return (
    <>
      <Header
        title="Settings"
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: project.name, href: `/dashboard/projects/${projectId}` },
          { label: "Settings" },
        ]}
      />
      <div className="p-8 space-y-10">
        <section>
          <h2 className="text-lg font-bold mb-4">General</h2>
          <ProjectSettingsForm
            projectId={projectId}
            name={project.name}
            webhookUrl={project.webhookUrl ?? ""}
          />
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4">API Keys</h2>
          <ApiKeyManager
            projectId={projectId}
            appUrl={appUrl}
            keys={keys.map((k) => ({
              id: k.id,
              prefix: k.keyPrefix,
              createdAt: k.createdAt.toISOString(),
            }))}
          />
        </section>

        <section>
          <h2 className="text-lg font-bold mb-4 text-red-400">Danger Zone</h2>
          <DeleteProjectButton projectId={projectId} projectName={project.name} />
        </section>
      </div>
    </>
  );
}
