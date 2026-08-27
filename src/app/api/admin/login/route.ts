import { NextResponse } from "next/server";
import { COOKIE, checkPassword, cookieOptions, issueToken } from "@/lib/auth";

export async function POST(request: Request) {
  let password: unknown;
  try {
    ({ password } = await request.json());
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  if (!checkPassword(password)) {
    // Blunt the brute-force edge without making the real login feel slow.
    await new Promise((resolve) => setTimeout(resolve, 400));
    return NextResponse.json({ ok: false, error: "Wrong password" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE, issueToken(), cookieOptions);
  return response;
}
