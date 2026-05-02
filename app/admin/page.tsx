import { isAuthenticated } from "@/lib/auth";
import { getInquiries } from "@/lib/inquiries";
import { AdminShell } from "@/components/admin/AdminShell";
import { AdminLogin } from "@/components/admin/AdminLogin";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "관리자 | Gomdol Tool",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const authed = await isAuthenticated();

  if (!authed) {
    return <AdminLogin />;
  }

  const inquiries = await getInquiries();
  return <AdminShell inquiries={inquiries} />;
}
