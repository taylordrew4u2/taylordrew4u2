import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { isAuthed } from "@/lib/auth";
import { SITE_URL } from "@/lib/defaults";
import { buildAuthorizeUrl } from "@/lib/instagram";

export const dynamic = "force-dynamic";

export const OAUTH_STATE_COOKIE = "ig_oauth_state";
export const REDIRECT_URI = `${SITE_URL}/api/admin/instagram/callback`;

/** Visiting this URL is the entire "Log in with Instagram" button. */
export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.redirect(new URL("/admin", SITE_URL));
  }

  const appId = process.env.INSTAGRAM_APP_ID;
  if (!appId) {
    const url = new URL("/admin", SITE_URL);
    url.searchParams.set("instagram", "error");
    url.searchParams.set("message", "INSTAGRAM_APP_ID is not set in this deployment's environment variables yet.");
    return NextResponse.redirect(url);
  }

  // A short-lived, single-use value Instagram hands back unchanged — proves
  // the browser completing the callback is the same one that started here,
  // not a forged redirect.
  const state = randomBytes(16).toString("hex");

  const response = NextResponse.redirect(buildAuthorizeUrl(appId, REDIRECT_URI, state));
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600, // the whole login-and-approve round trip only needs minutes
  });
  return response;
}
