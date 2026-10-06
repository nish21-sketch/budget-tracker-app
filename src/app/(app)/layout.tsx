import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/data";
import { firstOfMonth, monthLabel } from "@/lib/utils";
import NavBar from "@/components/NavBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await getProfile();
  if (profile && !profile.onboarding_complete) redirect("/onboarding");

  const initial = (user.email ?? "?").charAt(0).toUpperCase();

  return (
    <div className="app">
      <NavBar monthLabel={monthLabel(firstOfMonth())} initial={initial} />
      {children}
    </div>
  );
}
