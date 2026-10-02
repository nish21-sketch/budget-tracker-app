import { getCategories, getSoFarByCategory, getProfile } from "@/lib/data";
import LogForm from "./LogForm";

export default async function LogPage() {
  const [categories, soFarMap, profile] = await Promise.all([
    getCategories(),
    getSoFarByCategory(),
    getProfile(),
  ]);
  const cats = categories.map((c) => ({ ...c, soFar: soFarMap[c.id] ?? 0 }));

  return <LogForm categories={cats} currency={profile?.currency ?? "₹"} />;
}
