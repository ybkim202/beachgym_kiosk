import { isAdmin } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { TotalDashboard } from "@/components/admin/TotalDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "전체 통계 · ILSAN BEACH GYM",
};

export default async function AdminTotalPage() {
  const authed = await isAdmin();
  return authed ? <TotalDashboard /> : <AdminLogin />;
}
