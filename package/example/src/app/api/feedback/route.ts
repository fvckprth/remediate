import { parseFeedback } from "remediate/server";

export async function POST(req: Request) {
  try {
    const { submission, files } = await parseFeedback(req);

    console.log("\n=== FEEDBACK RECEIVED ===");
    console.log(`id: ${submission.id}`);
    console.log(`url: ${submission.url}`);
    console.log(`items: ${submission.items.length}`);
    for (const item of submission.items) {
      console.log(`  [${item.type}] priority=${item.priority}`);
      if (item.type === "textNote") console.log(`    text: ${item.text}`);
      if (item.type === "annotation") console.log(`    note: ${item.note}, element: ${item.element.name}`);
    }
    console.log(`files: ${files.size}`);
    for (const [name, file] of files) {
      console.log(`  ${name}: ${file.type} (${file.size} bytes)`);
    }
    console.log(`metadata: ${JSON.stringify(submission.metadata)}`);
    console.log("========================\n");

    return Response.json({ ok: true, id: submission.id });
  } catch (err) {
    console.error("[feedback] parseFeedback failed", err);
    return Response.json({ ok: false, error: String(err) }, { status: 400 });
  }
}
