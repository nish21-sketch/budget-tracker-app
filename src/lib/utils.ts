export function fmt(n: number, currency: string = "₹") {
  return currency + Math.round(n).toLocaleString("en-IN");
}

export function firstOfMonth(d: Date = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function addMonths(date: Date, n: number) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

export function monthLabel(date: Date) {
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function daysInMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

export function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}
