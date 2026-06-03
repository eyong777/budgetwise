export type Currency = "AED" | "USD" | "EUR" | "GBP" | "PHP";
export type Frequency = "daily" | "weekly" | "monthly" | "yearly";

export type Profile = {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  created_at: string;
};

export type Wallet = {
  id: string;
  user_id: string;
  name: string;
  type: "cash" | "bank" | "savings" | "credit";
  balance: number;
  created_at?: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  wallet_id: string | null;
  category: string;
  type: "expense";
  amount: number;
  description: string | null;
  date: string;
  created_at?: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category: string;
  limit_amount: number;
  month: number;
  year: number;
};

export type MonthlySaving = {
  id: string;
  user_id: string;
  monthly_savings: number;
  unused_budget: number;
  leftover_wallet: number;
  total_saved: number;
  month: number;
  year: number;
  closed_at: string | null;
};

export type RecurringTransaction = {
  id: string;
  user_id: string;
  wallet_id: string | null;
  type: "expense";
  category: string;
  amount: number;
  description: string | null;
  frequency: Frequency;
  next_run: string;
};

export type SavingsBreakdown = {
  id: string;
  user_id: string;
  saving_id: string | null;
  category: string;
  amount: number;
  month: number;
  year: number;
};
