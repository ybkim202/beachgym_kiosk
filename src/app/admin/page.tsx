import { isAdmin } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { Dashboard } from "@/components/admin/Dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "관리자 · ILSAN BEACH GYM",
};

export default async function AdminPage() {
  const authed = await isAdmin();
  return authed ? <Dashboard /> : <AdminLogin />;
}
