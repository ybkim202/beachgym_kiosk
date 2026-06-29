import { isAdmin } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { StaffHub } from "@/components/staff/StaffHub";
import {
  STAFF_CHECKOUT_PHOTOS,
  STAFF_PHOTO_CATEGORIES,
  STAFF_TASK_CATEGORIES,
} from "@/lib/config";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "직원 업무 기록 · ILSAN BEACH GYM",
};

export default async function StaffPage() {
  if (!(await isAdmin())) return <AdminLogin />;
  return (
    <StaffHub
      taskCategories={STAFF_TASK_CATEGORIES.map((c) => ({ ...c }))}
      photoCategories={STAFF_PHOTO_CATEGORIES.map((c) => ({ ...c }))}
      checkoutPhotos={STAFF_CHECKOUT_PHOTOS.map((c) => ({ ...c }))}
    />
  );
}
