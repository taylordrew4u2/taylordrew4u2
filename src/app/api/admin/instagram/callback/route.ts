import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { SITE_URL } from "@/lib/defaults";
import { getContentStrict, patchContent } from "@/lib/store";
import { exchangeCodeForToken, exchangeForLongLivedToken } from "@/lib/instagram";
import { OAUTH_STATE_COOKIE, REDIRECT_URI } from "../authorize/route";

export const dynamic = "force-dynamic";

function fail(message: string) {
  const url = new URL("/admin", SITE_URL);
  url.searchParams.set("instagram", "error");
  url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

/** Instagram lands the browser here after the account owner approves (or denies) access. */
export async function GET(request: Request) {
  if (!(await isAuthed())) return NextResponse.redirect(new URL("/admin", SITE_URL));

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const deniedReason = url.searchParams.get("error_reason");
  if (deniedReason) return fail("Instagram authorization was not completed.");

  const expectedState = request.headers
    .get("cookie")
    ?.split(/;\s*/)
    .find((entry) => entry.startsWith(`${OAUTH_STATE_COOKIE}=`))
    ?.split("=")[1];

  if (!code || !state || !expectedState || state !== expectedState) {
    return fail("That login link had expired or been reused — try Connect Instagram again.");
  }

  const appId = process.env.INSTAGRAM_APP_ID;
  const appSecret = process.env.INSTAGRAM_APP_SECRET;
  if (!appId || !appSecret) {
    return fail("INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET are not both set in this deployment yet.");
  }

  try {
    const content = await getContentStrict();
    const { accessToken: shortLived } = await exchangeCodeForToken({
      code,
      redirectUri: REDIRECT_URI,
      appId,
      appSecret,
    });
    const { accessToken, tokenExpiresAt } = await exchangeForLongLivedToken(shortLived, appSecret);

    await patchContent({
      instagram: {
        ...content.instagram,
        accessToken,
        tokenExpiresAt,
        lastError: "",
      },
    });

    const success = new URL("/admin", SITE_URL);
    success.searchParams.set("instagram", "connected");
    const response = NextResponse.redirect(success);
    response.cookies.set(OAUTH_STATE_COOKIE, "", { maxAge: 0, path: "/" });
    return response;
  } catch (error) {
    console.error("[instagram oauth]", error);
    return fail(error instanceof Error ? error.message : "Connecting to Instagram failed.");
  }
}
