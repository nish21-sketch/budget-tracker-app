export const CATEGORY_TYPES = [
  "Fixed Deduction",
  "Fluid Essential",
  "Personal",
  "Investment",
] as const;

export type CategoryType = (typeof CATEGORY_TYPES)[number];

export const DEFAULT_CATEGORIES: { name: string; type: CategoryType; idealPlanAmount: number }[] = [
  { name: "Rent / Mortgage", type: "Fixed Deduction", idealPlanAmount: 0 },
  { name: "Loan / EMI Payment", type: "Fixed Deduction", idealPlanAmount: 0 },
  { name: "Insurance Premium", type: "Fixed Deduction", idealPlanAmount: 0 },
  { name: "Subscriptions", type: "Fixed Deduction", idealPlanAmount: 0 },

  { name: "Groceries", type: "Fluid Essential", idealPlanAmount: 0 },
  { name: "Utilities", type: "Fluid Essential", idealPlanAmount: 0 },
  { name: "Internet / Mobile Bill", type: "Fluid Essential", idealPlanAmount: 0 },
  { name: "Transport / Fuel", type: "Fluid Essential", idealPlanAmount: 0 },
  { name: "Healthcare / Medical", type: "Fluid Essential", idealPlanAmount: 0 },

  { name: "Dining Out", type: "Personal", idealPlanAmount: 0 },
  { name: "Entertainment", type: "Personal", idealPlanAmount: 0 },
  { name: "Shopping", type: "Personal", idealPlanAmount: 0 },
  { name: "Fitness / Gym", type: "Personal", idealPlanAmount: 0 },
  { name: "Personal Care", type: "Personal", idealPlanAmount: 0 },
  { name: "Travel", type: "Personal", idealPlanAmount: 0 },
  { name: "Gifts & Donations", type: "Personal", idealPlanAmount: 0 },
  { name: "Miscellaneous", type: "Personal", idealPlanAmount: 0 },

  { name: "Emergency Fund", type: "Investment", idealPlanAmount: 0 },
  { name: "Retirement Savings", type: "Investment", idealPlanAmount: 0 },
  { name: "Mutual Fund / SIP", type: "Investment", idealPlanAmount: 0 },
  { name: "Recurring Deposit / Savings", type: "Investment", idealPlanAmount: 0 },
  { name: "Stocks / Equity", type: "Investment", idealPlanAmount: 0 },
];
