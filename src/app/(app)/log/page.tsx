import { getCategories, getSoFarByCategory, getProfile, getRecentTransactions } from "@/lib/data";
import LogForm from "./LogForm";

export default async function LogPage() {
  const [categories, soFarMap, profile, recent] = await Promise.all([
    getCategories(),
    getSoFarByCategory(),
    getProfile(),
    getRecentTransactions(10),
  ]);
  const cats = categories.map((c) => ({ ...c, soFar: soFarMap[c.id] ?? 0 }));
  return <LogForm categories={cats} currency={profile?.currency ?? "₹"} initialRecent={recent} />;
}