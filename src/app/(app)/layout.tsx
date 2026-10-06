import { redirect } from "next/navigation";
import { getCurrentUser, getProfile, getCategories } from "@/lib/data";
import { firstOfMonth, monthLabel } from "@/lib/utils";
import NavBar from "@/components/NavBar";
import QuickLogButton from "@/components/QuickLogButton";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (profile && !profile.onboarding_complete) redirect("/onboarding");

  const initial = (user.email ?? "?").charAt(0).toUpperCase();
  const categories = await getCategories();

  return (
    <div className="app">
      <NavBar monthLabel={monthLabel(firstOfMonth())} initial={initial} />
      {children}
      <QuickLogButton categories={categories} currency={profile?.currency ?? "₹"} />
    </div>
  );
}
