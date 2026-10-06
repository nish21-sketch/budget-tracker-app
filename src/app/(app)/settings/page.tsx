import { getCategories, getIncome, getProfile } from "@/lib/data";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const [categories, income, profile] = await Promise.all([getCategories(), getIncome(), getProfile()]);
  return <SettingsForm categories={categories} income={income} currency={profile?.currency ?? "₹"} />;
}
