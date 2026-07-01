import { isAdmin } from "@/lib/adminAuth";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { ChallengeApp } from "@/components/challenge/ChallengeApp";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "챌린지 진행 · ILSAN BEACH GYM",
};

export default async function ChallengePage() {
  if (!(await isAdmin())) return <AdminLogin />;
  return <ChallengeApp />;
}
