import { auth } from "@/auth";
import { db } from "@/db";
import { feedback, feedbackItems, projects } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Badge } from "@/components/ui/badge";
import { RelativeTime } from "@/components/ui/relative-time";
import { getSignedUrl } from "@/lib/storage";
import { DeleteFeedbackButton } from "./delete-feedback-button";

const priorityColors: Record<string, string> = {
  urgent: "border-red-500/50 text-red-400",
  high: "border-orange-500/50 text-orange-400",
  medium: "border-yellow-500/50 text-yellow-400",
  low: "border-blue-500/50 text-blue-400",
  none: "border-border text-muted",
};

export default async function FeedbackDetailPage({
  params,
}: {
  params: Promise<{ feedbackId: string }>;
}) {
  const { feedbackId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const [entry] = await db
    .select()
    .from(feedback)
    .where(eq(feedback.id, feedbackId))
    .limit(1);

  if (!entry) notFound();

  // Verify ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, entry.projectId), eq(projects.userId, session.user.id)))
    .limit(1);

  if (!project) notFound();

  const items = await db
    .select()
    .from(feedbackItems)
    .where(eq(feedbackItems.feedbackId, feedbackId))
    .orderBy(asc(feedbackItems.index));

  // Generate presigned URLs
  const itemsWithUrls = await Promise.all(
    items.map(async (item) => ({
      ...item,
      signedUrl: item.fileUrl ? await getSignedUrl(item.fileUrl) : null,
    }))
  );

  const env = entry.environment as {
    browser?: { name: string; version: string };
    os?: { name: string; version: string };
    viewport?: { width: number; height: number };
  };

  return (
    <>
      <Header
        title="Feedback"
        breadcrumbs={[
          { label: "Projects", href: "/dashboard" },
          { label: project.name, href: `/dashboard/projects/${project.id}` },
          { label: feedbackId.slice(0, 12) },
        ]}
        action={<DeleteFeedbackButton feedbackId={feedbackId} />}
      />
      <div className="p-8 space-y-6">
        {/* Metadata */}
        <div className="rounded-xl border border-border p-5 space-y-2 text-sm">
          <div className="flex flex-wrap gap-8">
            <div>
              <span className="text-muted">URL</span>
              <p className="mt-0.5">{entry.url}</p>
            </div>
            <div>
              <span className="text-muted">Time</span>
              <p className="mt-0.5">
                <RelativeTime date={entry.timestamp} />
              </p>
            </div>
            <div>
              <span className="text-muted">Browser</span>
              <p className="mt-0.5">
                {env.browser?.name} {env.browser?.version}
              </p>
            </div>
            <div>
              <span className="text-muted">OS</span>
              <p className="mt-0.5">
                {env.os?.name} {env.os?.version}
              </p>
            </div>
            {env.viewport && (
              <div>
                <span className="text-muted">Viewport</span>
                <p className="mt-0.5">
                  {env.viewport.width} x {env.viewport.height}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="space-y-4">
          {itemsWithUrls.map((item) => {
            const data = item.data as Record<string, unknown>;
            return (
              <div
                key={item.id}
                className="rounded-xl border border-border p-5"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Badge type={item.type} />
                  {item.fileSize && (
                    <span className="text-xs text-muted">
                      {(item.fileSize / 1024).toFixed(1)} KB
                    </span>
                  )}
                </div>

                {item.type === "textNote" && (
                  <p className="text-sm whitespace-pre-wrap">
                    {(data.text as string) ?? ""}
                  </p>
                )}

                {item.type === "annotation" && (
                  <AnnotationDetail data={data} />
                )}

                {item.type === "photo" && item.signedUrl && (
                  <img
                    src={item.signedUrl}
                    alt="Screenshot"
                    className="max-w-full rounded-lg border border-border"
                  />
                )}

                {item.type === "video" && item.signedUrl && (
                  <video
                    src={item.signedUrl}
                    controls
                    className="max-w-full rounded-lg"
                  />
                )}

                {item.type === "voiceNote" && item.signedUrl && (
                  <audio src={item.signedUrl} controls className="w-full" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

function AnnotationDetail({ data }: { data: Record<string, unknown> }) {
  const element = data.element as {
    name?: string;
    selector?: string;
    elementPath?: string;
    nearbyText?: string;
    cssClasses?: string;
  } | undefined;
  const priority = (data.priority as string) ?? "none";
  const note = data.note as string | undefined;
  const colorClass = priorityColors[priority] ?? priorityColors.none;

  return (
    <div className="space-y-3">
      {priority !== "none" && (
        <span
          className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${colorClass}`}
        >
          {priority}
        </span>
      )}

      {note && (
        <p className="text-sm whitespace-pre-wrap">{note}</p>
      )}

      {element && (
        <div className="rounded-lg bg-surface border border-border p-3 text-xs space-y-1.5">
          {element.name && (
            <div>
              <span className="text-muted">Element </span>
              <span className="font-medium">{element.name}</span>
            </div>
          )}
          {element.selector && (
            <div>
              <span className="text-muted">Selector </span>
              <code className="text-muted bg-background px-1 py-0.5 rounded">
                {element.selector}
              </code>
            </div>
          )}
          {element.elementPath && (
            <div>
              <span className="text-muted">Path </span>
              <code className="text-muted bg-background px-1 py-0.5 rounded">
                {element.elementPath}
              </code>
            </div>
          )}
          {element.nearbyText && (
            <div>
              <span className="text-muted">Text </span>
              <span className="truncate max-w-xs inline-block align-bottom">
                {element.nearbyText.slice(0, 100)}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
