import type { Metadata } from "next";
import { isAuthed } from "@/lib/auth";
import { getContent, storageWarning } from "@/lib/store";
import AdminApp from "./AdminApp";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!(await isAuthed())) return <LoginForm />;
  return <AdminApp initial={await getContent()} warning={await storageWarning()} />;
}
