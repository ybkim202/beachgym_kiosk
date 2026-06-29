import { isAdmin } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { SurveyDashboard } from "@/components/admin/SurveyDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "설문 결과 · ILSAN BEACH GYM" };

export default async function AdminSurveyPage() {
  return (await isAdmin()) ? <SurveyDashboard /> : <AdminLogin />;
}
