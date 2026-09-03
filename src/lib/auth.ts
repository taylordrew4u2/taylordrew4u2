import "server-only";
import { cookies } from "next/headers";
import { COOKIE, verifyToken } from "./session";

export {
  ADMIN_PASSWORD,
  COOKIE,
  adminConfigured,
  checkPassword,
  cookieOptions,
  issueToken,
  verifyToken,
} from "./session";

/** Whether the current request carries a valid admin session. */
export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}
