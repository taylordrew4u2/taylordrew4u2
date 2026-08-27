import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAuthed } from "@/lib/auth";
import { getContent, patchContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ ok: true, content: await getContent() });
}

/** Auto-save endpoint: the admin sends a partial patch on every change. */
export async function PATCH(request: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let patch: unknown;
  try {
    patch = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  try {
    const content = await patchContent(patch);
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, updatedAt: content.updatedAt });
  } catch (error) {
    console.error("[admin] save failed:", error);
    return NextResponse.json({ ok: false, error: "Save failed" }, { status: 500 });
  }
}
