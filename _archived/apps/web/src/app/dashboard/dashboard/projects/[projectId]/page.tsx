import { auth } from "@/auth";
import { db } from "@/db";
import { projects, feedback, feedbackItems, apiKeys } from "@/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { RelativeTime } from "@/components/ui/relative-time";
import { ScriptSnippet } from "@/components/ui/script-snippet";
import Link from "next/link";

const PAGE_SIZE = 25;

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { projectId } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const session = await auth();
  if (!session?.user?.id) return null;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) notFound();

  // Check if project has any API keys (for install guide)
  const [firstKey] = await db
    .select({ prefix: apiKeys.keyPrefix })
    .from(apiKeys)
    .where(eq(apiKeys.projectId, projectId))
    .limit(1);

  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const appUrl = `${proto}://${host}`;

  // Total count for pagination
  const [{ total }] = await db
    .select({ total: count() })
    .from(feedback)
    .where(eq(feedback.projectId, projectId));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const offset = (page - 1) * PAGE_SIZE;

  const feedbackList = await db
    .select({
      id: feedback.id,
      url: feedback.url,
      timestamp: feedback.timestamp,
      environment: feedback.environment,
      itemCount: count(feedbackItems.id),
    })
    .from(feedback)
    .leftJoin(feedbackItems, eq(feedbackItems.feedbackId, feedback.id))
    .where(eq(feedback.projectId, projectId))
    .groupBy(feedback.id)
    .orderBy(desc(feedback.timestamp))
    .limit(PAGE_SIZE)
    .offset(offset);

  return (
    <>
      <Header
        title={project.name}
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: project.name },
        ]}
        action={
          <Link
            href={`/dashboard/projects/${projectId}/settings`}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-surface transition-colors"
          >
            Settings
          </Link>
        }
      />
      <div className="p-8">
        {total === 0 ? (
          <InstallGuide projectId={projectId} appUrl={appUrl} hasKey={!!firstKey} />
        ) : (
          <>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted">
                  <th className="pb-3 font-medium">Time</th>
                  <th className="pb-3 font-medium">URL</th>
                  <th className="pb-3 font-medium">Items</th>
                  <th className="pb-3 font-medium">Environment</th>
                </tr>
              </thead>
              <tbody>
                {feedbackList.map((fb) => {
                  const env = fb.environment as {
                    browser?: { name: string };
                    os?: { name: string };
                  };
                  return (
                    <tr key={fb.id} className="border-b border-border">
                      <td className="py-3">
                        <Link
                          href={`/dashboard/feedback/${fb.id}`}
                          className="hover:underline"
                        >
                          <RelativeTime date={fb.timestamp} />
                        </Link>
                      </td>
                      <td className="py-3 text-muted max-w-xs truncate">
                        {fb.url}
                      </td>
                      <td className="py-3">
                        <Badge type={`${fb.itemCount} item${fb.itemCount !== 1 ? "s" : ""}`} />
                      </td>
                      <td className="py-3 text-muted text-xs">
                        {env.browser?.name} / {env.os?.name}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between text-sm">
                <span className="text-muted">
                  Page {page} of {totalPages} ({total} total)
                </span>
                <div className="flex gap-2">
                  {page > 1 && (
                    <Link
                      href={`/dashboard/projects/${projectId}?page=${page - 1}`}
                      className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  {page < totalPages && (
                    <Link
                      href={`/dashboard/projects/${projectId}?page=${page + 1}`}
                      className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function InstallGuide({ projectId, appUrl, hasKey }: { projectId: string; appUrl: string; hasKey: boolean }) {
  return (
    <div className="max-w-xl mx-auto text-center space-y-6 py-12">
      <div>
        <h2 className="text-lg font-bold">No feedback yet</h2>
        <p className="mt-1 text-sm text-muted">
          Add the widget to your site to start collecting feedback.
        </p>
      </div>

      <div className="text-left space-y-4">
        {hasKey ? (
          <>
            <p className="text-xs font-medium text-muted mb-2">
              Paste this snippet before the closing <code className="text-foreground">&lt;/body&gt;</code> tag on your site:
            </p>
            <ScriptSnippet appUrl={appUrl} keyPlaceholder />
          </>
        ) : (
          <>
            <p className="text-xs font-medium text-muted mb-2">1. Create an API key</p>
            <p className="text-sm text-muted">
              Go to{" "}
              <Link
                href={`/dashboard/projects/${projectId}/settings`}
                className="text-foreground underline"
              >
                Settings
              </Link>
              {" "}to create an API key. You&apos;ll get a snippet to paste into your site.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
