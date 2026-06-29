import { isAdmin } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { StaffDashboard } from "@/components/admin/StaffDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "직원 업무 기록 · ILSAN BEACH GYM" };

export default async function AdminStaffPage() {
  return (await isAdmin()) ? <StaffDashboard /> : <AdminLogin />;
}
