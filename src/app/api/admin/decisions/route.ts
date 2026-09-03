import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { pickRandom } from "@/lib/decisions";
import {
  archiveAll,
  deleteSubmission,
  listSubmissions,
  setStatus,
} from "@/lib/submissions";

export const dynamic = "force-dynamic";

/** The whole pile, newest first. The admin's "Tonight" panel reads this. */
export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, submissions: await listSubmissions() });
  } catch (error) {
    console.error("[admin/decisions] list failed:", error);
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json({ ok: false, error: detail || "Could not read submissions" }, { status: 500 });
  }
}

type Action =
  | { action: "draw" }
  | { action: "reopen"; id: string }
  | { action: "delete"; id: string }
  | { action: "archive-all" };

/**
 * Stage actions. "draw" is the one that matters: it picks one open
 * submission at random on the server, marks it drawn, and sends it back —
 * so two phones in the room can never pull the same one.
 */
export async function POST(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: Action;
  try {
    body = (await request.json()) as Action;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  try {
    if (body.action === "draw") {
      const open = (await listSubmissions()).filter((entry) => entry.status === "open");
      const picked = pickRandom(open);
      if (!picked) return NextResponse.json({ ok: true, drawn: null, remaining: 0 });
      const drawn = await setStatus(picked.id, "drawn");
      return NextResponse.json({ ok: true, drawn, remaining: open.length - 1 });
    }
    if (body.action === "reopen") {
      return NextResponse.json({ ok: true, submission: await setStatus(body.id, "open") });
    }
    if (body.action === "delete") {
      await deleteSubmission(body.id);
      return NextResponse.json({ ok: true });
    }
    if (body.action === "archive-all") {
      return NextResponse.json({ ok: true, archived: await archiveAll() });
    }
    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[admin/decisions] action failed:", error);
    const detail = error instanceof Error ? error.message : "";
    return NextResponse.json({ ok: false, error: detail || "Action failed" }, { status: 500 });
  }
}
