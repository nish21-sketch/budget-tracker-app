import { getAllTransactions, getProfile } from "@/lib/data";
import HistoricTable from "./HistoricTable";

export default async function HistoricPage() {
  const [rows, profile] = await Promise.all([getAllTransactions(), getProfile()]);

  const flat = rows.map((r) => ({
    id: r.id,
    month: r.month,
    category: (r.categories as unknown as { name: string } | null)?.name ?? "—",
    amount: Number(r.amount),
    note: r.note ?? "",
  }));

  return <HistoricTable rows={flat} currency={profile?.currency ?? "₹"} />;
}
