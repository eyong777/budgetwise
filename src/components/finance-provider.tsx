"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Budget, MonthlySaving, Profile, RecurringTransaction, SavingsBreakdown, Transaction, Wallet } from "@/lib/types";
import { expenseCategories } from "@/lib/constants";
import { monthKey } from "@/lib/utils";

type BreakdownItem = {
  category: string;
  budgeted: number;
  spent: number;
  amount: number;
};

type FinanceContextValue = {
  userId: string | null;
  profile: Profile | null;
  wallets: Wallet[];
  transactions: Transaction[];
  budgets: Budget[];
  savings: MonthlySaving[];
  savingsBreakdowns: SavingsBreakdown[];
  recurring: RecurringTransaction[];
  loading: boolean;
  currency: string;
  setCurrency: (currency: string) => void;
  refresh: () => Promise<void>;
  saveWallet: (wallet: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  transfer: (fromId: string, toId: string, amount: number) => Promise<void>;
  saveTransaction: (transaction: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  saveBudget: (budget: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  saveMonthlySavings: (amount: number, month?: number, year?: number) => Promise<void>;
  deleteSavingsMonth: (id: string, month: number, year: number) => Promise<void>;
  clearSavingsHistory: () => Promise<void>;
  closeMonth: (month: number, year: number) => Promise<void>;
  saveRecurring: (item: Partial<RecurringTransaction>) => Promise<void>;
  deleteRecurring: (id: string) => Promise<void>;
  updateProfile: (profile: Partial<Profile>) => Promise<void>;
};

const FinanceContext = createContext<FinanceContextValue | null>(null);

const demoWallets: Wallet[] = [
  { id: "demo-bank", user_id: "demo", name: "Main Bank", type: "bank", balance: 6000 },
  { id: "demo-cash", user_id: "demo", name: "Cash", type: "cash", balance: 900 }
];

const demoTransactions: Transaction[] = [
  { id: "t1", user_id: "demo", wallet_id: "demo-bank", category: "rent", type: "expense", amount: 1200, description: "Apartment rent", date: "2026-06-02" },
  { id: "t2", user_id: "demo", wallet_id: "demo-cash", category: "food", type: "expense", amount: 400, description: "Groceries", date: "2026-06-03" },
  { id: "t3", user_id: "demo", wallet_id: "demo-bank", category: "transport", type: "expense", amount: 530, description: "Commute", date: "2026-06-08" }
];

const demoBudgets: Budget[] = [
  { id: "b1", user_id: "demo", category: "food", limit_amount: 1000, month: 6, year: 2026 },
  { id: "b2", user_id: "demo", category: "rent", limit_amount: 1200, month: 6, year: 2026 },
  { id: "b3", user_id: "demo", category: "shopping", limit_amount: 2000, month: 6, year: 2026 },
  { id: "b4", user_id: "demo", category: "transport", limit_amount: 700, month: 6, year: 2026 }
];

const demoSavings: MonthlySaving[] = [
  { id: "s1", user_id: "demo", monthly_savings: 2000, unused_budget: 2370, leftover_wallet: 0, total_saved: 4370, month: 6, year: 2026, closed_at: null }
];

const demoBreakdowns: SavingsBreakdown[] = [
  { id: "sb1", user_id: "demo", saving_id: "s1", category: "food", amount: 600, month: 6, year: 2026 },
  { id: "sb2", user_id: "demo", saving_id: "s1", category: "shopping", amount: 2000, month: 6, year: 2026 },
  { id: "sb3", user_id: "demo", saving_id: "s1", category: "transport", amount: 170, month: 6, year: 2026 }
];

const demoRecurring: RecurringTransaction[] = [
  { id: "r1", user_id: "demo", wallet_id: "demo-bank", type: "expense", category: "bills", amount: 340, description: "Utilities", frequency: "monthly", next_run: "2026-06-27" }
];

function previousMonth(date = new Date()) {
  const previous = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return { month: previous.getMonth() + 1, year: previous.getFullYear() };
}

function nextMonth(month: number, year: number) {
  const next = new Date(year, month, 1);
  return { month: next.getMonth() + 1, year: next.getFullYear() };
}

function sameMonth(dateText: string, month: number, year: number) {
  const date = new Date(dateText);
  return date.getMonth() + 1 === month && date.getFullYear() === year;
}

function monthDateRange(month: number, year: number) {
  const start = `${year}-${String(month).padStart(2, "0")}-01`;
  const next = new Date(year, month, 1);
  const end = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-01`;
  return { start, end };
}

function uniqueBudgetsForMonth(budgets: Budget[], month: number, year: number) {
  const byCategory = new Map<string, Budget>();
  budgets
    .filter((budget) => budget.month === month && budget.year === year)
    .forEach((budget) => {
      if (!byCategory.has(budget.category)) byCategory.set(budget.category, budget);
    });
  return Array.from(byCategory.values());
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>(demoWallets);
  const [transactions, setTransactions] = useState<Transaction[]>(demoTransactions);
  const [budgets, setBudgets] = useState<Budget[]>(demoBudgets);
  const [savings, setSavings] = useState<MonthlySaving[]>(demoSavings);
  const [savingsBreakdowns, setSavingsBreakdowns] = useState<SavingsBreakdown[]>(demoBreakdowns);
  const [recurring, setRecurring] = useState<RecurringTransaction[]>(demoRecurring);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState("AED");
  const [client, setClient] = useState<ReturnType<typeof createSupabaseBrowserClient> | null>(null);
  const [savingsSchemaReady, setSavingsSchemaReady] = useState(true);

  const calculateBreakdown = useCallback((month: number, year: number): BreakdownItem[] => {
    const monthBudgets = uniqueBudgetsForMonth(budgets, month, year);
    const categories = monthBudgets.map((budget) => budget.category);

    return categories
      .map((category) => {
        const budgeted = Number(monthBudgets.find((budget) => budget.category === category)?.limit_amount ?? 0);
        const spent = transactions
          .filter((item) => item.category === category && sameMonth(item.date, month, year))
          .reduce((sum, item) => sum + Number(item.amount), 0);
        return { category, budgeted, spent, amount: Math.max(0, budgeted - spent) };
      })
      .filter((item) => item.budgeted > 0)
      .sort((a, b) => {
        const aIndex = expenseCategories.indexOf(a.category as (typeof expenseCategories)[number]);
        const bIndex = expenseCategories.indexOf(b.category as (typeof expenseCategories)[number]);
        if (aIndex === -1 && bIndex === -1) return a.category.localeCompare(b.category);
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
      });
  }, [budgets, transactions]);

  const saveSavingsRecord = useCallback(async (manualAmount: number, month: number, year: number, close = false) => {
    const breakdown = calculateBreakdown(month, year);
    const unusedBudget = breakdown.reduce((sum, item) => sum + item.amount, 0);
    const expenses = transactions
      .filter((item) => sameMonth(item.date, month, year))
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const walletAmount = wallets.reduce((sum, wallet) => sum + Number(wallet.balance), 0);
    const leftoverWallet = Math.max(0, walletAmount - Number(manualAmount) - expenses);
    const totalSaved = Number(manualAmount) + leftoverWallet;
    const fullBreakdown = [
      ...breakdown,
      ...(leftoverWallet > 0 ? [{ category: "leftover wallet balance", budgeted: 0, spent: 0, amount: leftoverWallet }] : [])
    ];

    if (!savingsSchemaReady) {
      toast.error("Savings tables are missing. Run supabase/savings-system-migration.sql in Supabase SQL Editor.");
      return;
    }

    if (!client || !userId) {
      setSavings((current) => {
        const next = current.filter((item) => !(item.month === month && item.year === year));
        return [{ id: `demo-${year}-${month}`, user_id: "demo", monthly_savings: manualAmount, unused_budget: unusedBudget, leftover_wallet: leftoverWallet, total_saved: totalSaved, month, year, closed_at: close ? new Date().toISOString() : null }, ...next];
      });
      setSavingsBreakdowns((current) => [
        ...fullBreakdown.map((item) => ({ id: `demo-${year}-${month}-${item.category}`, user_id: "demo", saving_id: `demo-${year}-${month}`, category: item.category, amount: item.amount, month, year })),
        ...current.filter((item) => !(item.month === month && item.year === year))
      ]);
      return;
    }

    const { data, error } = await client
      .from("savings")
      .upsert({
        user_id: userId,
        monthly_savings: manualAmount,
        unused_budget: unusedBudget,
        leftover_wallet: leftoverWallet,
        total_saved: totalSaved,
        month,
        year,
        closed_at: close ? new Date().toISOString() : null
      }, { onConflict: "user_id,month,year" })
      .select()
      .single();

    if (error) {
      if (error.message.includes("schema cache") || error.message.includes("savings")) {
        setSavingsSchemaReady(false);
        toast.error("Savings tables are missing. Run the savings migration in Supabase SQL Editor.");
      } else {
        toast.error(error.message);
      }
      return;
    }

    await client.from("savings_breakdown").delete().eq("user_id", userId).eq("month", month).eq("year", year);
    if (fullBreakdown.length) {
      const { error: breakdownError } = await client.from("savings_breakdown").insert(fullBreakdown.map((item) => ({
        user_id: userId,
        saving_id: data.id,
        category: item.category,
        amount: item.amount,
        month,
        year
      })));
      if (breakdownError) toast.error(breakdownError.message);
    }
  }, [calculateBreakdown, client, savingsSchemaReady, transactions, userId, wallets]);

  const copyBudgetsToNextMonth = useCallback(async (month: number, year: number) => {
    const next = nextMonth(month, year);
    const sourceBudgets = uniqueBudgetsForMonth(budgets, month, year);
    if (!sourceBudgets.length) return;

    if (!client || !userId || !savingsSchemaReady) {
      setBudgets((current) => {
        const existingKeys = new Set(current.map((budget) => `${budget.category}-${budget.month}-${budget.year}`));
        const copies = sourceBudgets
          .filter((budget) => !existingKeys.has(`${budget.category}-${next.month}-${next.year}`))
          .map((budget) => ({
            ...budget,
            id: `demo-${next.year}-${next.month}-${budget.category}`,
            month: next.month,
            year: next.year
          }));
        return [...copies, ...current];
      });
      return;
    }

    const rows = sourceBudgets.map((budget) => ({
      user_id: userId,
      category: budget.category,
      limit_amount: budget.limit_amount,
      month: next.month,
      year: next.year
    }));
    const { error } = await client.from("budgets").upsert(rows, { onConflict: "user_id,category,month,year" });
    if (error) toast.error(error.message);
  }, [budgets, client, savingsSchemaReady, userId]);

  const refresh = useCallback(async () => {
    if (!client) return;
    setLoading(true);
    const { data: auth } = await client.auth.getUser();
    const user = auth.user;
    setUserId(user?.id ?? null);

    if (!user) {
      setLoading(false);
      return;
    }

    const [profileRes, walletRes, txRes, budgetRes, savingsRes, breakdownRes, recurringRes] = await Promise.all([
      client.from("profiles").select("*").eq("id", user.id).single(),
      client.from("wallets").select("*").order("created_at", { ascending: true }),
      client.from("transactions").select("*").eq("type", "expense").order("date", { ascending: false }),
      client.from("budgets").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
      client.from("savings").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
      client.from("savings_breakdown").select("*").order("year", { ascending: false }).order("month", { ascending: false }),
      client.from("recurring_transactions").select("*").eq("type", "expense").order("next_run", { ascending: true })
    ]);

    if (profileRes.data) setProfile(profileRes.data as Profile);
    if (walletRes.data) setWallets(walletRes.data as Wallet[]);
    if (txRes.data) setTransactions(txRes.data as Transaction[]);
    if (budgetRes.data) setBudgets(budgetRes.data as Budget[]);
    const savingsMissing = [savingsRes.error, breakdownRes.error].some((error) =>
      error?.message.includes("schema cache") || error?.message.includes("savings")
    );
    setSavingsSchemaReady(!savingsMissing);
    if (savingsMissing) {
      setSavings([]);
      setSavingsBreakdowns([]);
    } else {
      if (savingsRes.data) setSavings(savingsRes.data as MonthlySaving[]);
      if (breakdownRes.data) setSavingsBreakdowns(breakdownRes.data as SavingsBreakdown[]);
    }
    if (recurringRes.data) setRecurring(recurringRes.data as RecurringTransaction[]);
    setLoading(false);
  }, [client]);

  useEffect(() => {
    try {
      setClient(createSupabaseBrowserClient());
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!client || !userId || loading || !savingsSchemaReady) return;
    const previous = previousMonth();
    const existing = savings.find((item) => item.month === previous.month && item.year === previous.year);
    if (!existing) return;
    if (existing?.closed_at) return;
    const manualAmount = existing?.monthly_savings ?? 0;
    void saveSavingsRecord(manualAmount, previous.month, previous.year, true).then(refresh);
  }, [client, loading, refresh, saveSavingsRecord, savings, savingsSchemaReady, userId]);

  async function mutate<T extends { id: string }>(table: string, value: Partial<T>, label: string) {
    if (!client || !userId) {
      toast.info("Connect Supabase to save live data. Demo data is active.");
      return;
    }
    const payload = { ...value, user_id: userId };
    const query = value.id
      ? client.from(table).update(payload).eq("id", value.id)
      : client.from(table).insert(payload);
    const { error } = await query;
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(label);
    await refresh();
  }

  const value = useMemo<FinanceContextValue>(() => ({
    userId,
    profile,
    wallets,
    transactions,
    budgets,
    savings,
    savingsBreakdowns,
    recurring,
    loading,
    currency,
    setCurrency,
    refresh,
    saveWallet: (wallet) => mutate<Wallet>("wallets", wallet, "Wallet saved"),
    deleteWallet: async (id) => {
      if (!client) return;
      const { error } = await client.from("wallets").delete().eq("id", id);
      error ? toast.error(error.message) : toast.success("Wallet deleted");
      await refresh();
    },
    transfer: async (fromId, toId, amount) => {
      const from = wallets.find((wallet) => wallet.id === fromId);
      const to = wallets.find((wallet) => wallet.id === toId);
      if (!from || !to || amount <= 0) {
        toast.error("Choose wallets and a valid amount.");
        return;
      }
      if (!client || !userId) {
        toast.info("Transfers save after Supabase is connected.");
        return;
      }
      const { error } = await client.from("wallets").upsert([
        { ...from, balance: Number(from.balance) - amount, user_id: userId },
        { ...to, balance: Number(to.balance) + amount, user_id: userId }
      ]);
      error ? toast.error(error.message) : toast.success("Transfer complete");
      await refresh();
    },
    saveTransaction: async (transaction) => {
      if (!client || !userId) {
        toast.info("Connect Supabase to save live data. Demo data is active.");
        return;
      }
      const stats = getMonthlySavingsStats(wallets, transactions, budgets, savings, savingsBreakdowns);
      const previous = transaction.id ? transactions.find((item) => item.id === transaction.id) : null;
      const previousEffect = previous ? Number(previous.amount) : 0;
      const newAmount = Number(transaction.amount);
      if (newAmount - previousEffect > stats.walletBalance) {
        toast.error("This expense is above the wallet balance after monthly savings and expenses.");
        return;
      }
      const payload = { ...transaction, type: "expense", user_id: userId };
      const query = transaction.id
        ? client.from("transactions").update(payload).eq("id", transaction.id)
        : client.from("transactions").insert(payload);
      const { error } = await query;
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Expense saved");
      await refresh();
    },
    deleteTransaction: async (id) => {
      if (!client) return;
      const { error } = await client.from("transactions").delete().eq("id", id);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Expense deleted");
      await refresh();
    },
    saveBudget: async (budget) => {
      const month = Number(budget.month);
      const year = Number(budget.year);
      const category = String(budget.category);
      const existing = budgets.find((item) =>
        item.category === category &&
        Number(item.month) === month &&
        Number(item.year) === year &&
        item.id !== budget.id
      );
      const targetId = existing?.id ?? budget.id;

      if (!client || !userId) {
        setBudgets((current) => {
          if (targetId) {
            return current
              .map((item) => item.id === targetId ? { ...item, ...budget, id: targetId, month, year, category } as Budget : item)
              .filter((item) => !(existing && budget.id && item.id === budget.id && item.id !== existing.id));
          }
          return [{ ...budget, id: `demo-${year}-${month}-${category}`, user_id: "demo", month, year, category } as Budget, ...current];
        });
        toast.success("Budget saved");
        return;
      }

      const payload = { ...budget, id: targetId, user_id: userId, month, year, category };
      const query = targetId
        ? client.from("budgets").update(payload).eq("id", targetId).eq("user_id", userId)
        : client.from("budgets").insert(payload);
      const { error } = await query;
      if (error) {
        toast.error(error.message);
        return;
      }
      if (existing && budget.id && budget.id !== existing.id) {
        await client.from("budgets").delete().eq("id", budget.id).eq("user_id", userId);
      }
      toast.success(existing ? "Existing budget updated" : "Budget saved");
      await refresh();
    },
    deleteBudget: async (id) => {
      if (!client) return;
      const { error } = await client.from("budgets").delete().eq("id", id);
      error ? toast.error(error.message) : toast.success("Budget deleted");
      await refresh();
    },
    saveMonthlySavings: async (amount, month, year) => {
      if (!savingsSchemaReady) {
        toast.error("Savings tables are missing. Run supabase/savings-system-migration.sql in Supabase SQL Editor.");
        return;
      }
      const active = month && year ? { month, year } : monthKey();
      await saveSavingsRecord(amount, active.month, active.year, false);
      toast.success("Monthly savings saved");
      await refresh();
    },
    deleteSavingsMonth: async (id, month, year) => {
      if (!client || !userId) {
        setSavings((current) => current.filter((item) => item.id !== id));
        setSavingsBreakdowns((current) => current.filter((item) => !(item.month === month && item.year === year)));
        toast.success("Savings month deleted");
        return;
      }
      const { error: breakdownError } = await client
        .from("savings_breakdown")
        .delete()
        .eq("user_id", userId)
        .eq("month", month)
        .eq("year", year);
      if (breakdownError) {
        toast.error(breakdownError.message);
        return;
      }
      const { error } = await client.from("savings").delete().eq("id", id).eq("user_id", userId);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Savings month deleted");
      await refresh();
    },
    clearSavingsHistory: async () => {
      if (!client || !userId) {
        setSavings([]);
        setSavingsBreakdowns([]);
        toast.success("Savings history cleared");
        return;
      }
      const { error: breakdownError } = await client.from("savings_breakdown").delete().eq("user_id", userId);
      const { error } = await client.from("savings").delete().eq("user_id", userId);
      if (breakdownError || error) {
        toast.error(breakdownError?.message || error?.message || "Could not clear savings history.");
        return;
      }
      setSavings([]);
      setSavingsBreakdowns([]);
      toast.success("Savings history cleared");
      await refresh();
    },
    closeMonth: async (month, year) => {
      if (!savingsSchemaReady) {
        toast.error("Savings tables are missing. Run supabase/savings-system-migration.sql in Supabase SQL Editor.");
        return;
      }
      const existing = savings.find((item) => item.month === month && item.year === year);
      await saveSavingsRecord(existing?.monthly_savings ?? 0, month, year, true);
      await copyBudgetsToNextMonth(month, year);
      if (client && wallets.length) {
        await Promise.all(wallets.map((wallet) => client.from("wallets").update({ balance: 0 }).eq("id", wallet.id)));
        const range = monthDateRange(month, year);
        await client
          .from("transactions")
          .delete()
          .eq("user_id", userId)
          .eq("type", "expense")
          .gte("date", range.start)
          .lt("date", range.end);
      } else {
        setWallets((current) => current.map((wallet) => ({ ...wallet, balance: 0 })));
        setTransactions((current) => current.filter((item) => !sameMonth(item.date, month, year)));
      }
      toast.success("Leftover wallet money moved into savings");
      await refresh();
    },
    saveRecurring: (item) => mutate<RecurringTransaction>("recurring_transactions", { ...item, type: "expense" }, "Recurring item saved"),
    deleteRecurring: async (id) => {
      if (!client) return;
      const { error } = await client.from("recurring_transactions").delete().eq("id", id);
      error ? toast.error(error.message) : toast.success("Recurring item deleted");
      await refresh();
    },
    updateProfile: async (profileUpdate) => {
      if (!client || !userId) return;
      const { error } = await client.from("profiles").update(profileUpdate).eq("id", userId);
      error ? toast.error(error.message) : toast.success("Profile updated");
      await refresh();
    }
  }), [budgets, client, copyBudgetsToNextMonth, currency, loading, profile, recurring, refresh, saveSavingsRecord, savings, savingsBreakdowns, savingsSchemaReady, transactions, userId, wallets]);

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("useFinance must be used inside FinanceProvider");
  return context;
}

export function getMonthlySavingsStats(
  wallets: Wallet[],
  transactions: Transaction[],
  budgets: Budget[],
  savings: MonthlySaving[],
  savingsBreakdowns: SavingsBreakdown[]
) {
  const { month, year } = monthKey();
  const walletAmount = wallets.reduce((sum, wallet) => sum + Number(wallet.balance), 0);
  const currentSavings = savings.find((item) => item.month === month && item.year === year && !item.closed_at);
  const monthlySavings = Number(currentSavings?.monthly_savings ?? 0);
  const monthBudgets = uniqueBudgetsForMonth(budgets, month, year);
  const budgetCategories = monthBudgets.map((budget) => budget.category);
  const breakdown = budgetCategories
    .map((category) => {
      const budgeted = Number(monthBudgets.find((budget) => budget.category === category)?.limit_amount ?? 0);
      const spent = transactions
        .filter((item) => item.category === category && sameMonth(item.date, month, year))
        .reduce((sum, item) => sum + Number(item.amount), 0);
      return { category, budgeted, spent, amount: Math.max(0, budgeted - spent) };
    })
    .filter((item) => item.budgeted > 0)
    .sort((a, b) => {
      const aIndex = expenseCategories.indexOf(a.category as (typeof expenseCategories)[number]);
      const bIndex = expenseCategories.indexOf(b.category as (typeof expenseCategories)[number]);
      if (aIndex === -1 && bIndex === -1) return a.category.localeCompare(b.category);
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  const unusedBudget = breakdown.reduce((sum, item) => sum + item.amount, 0);
  const monthlyExpenses = transactions
    .filter((item) => sameMonth(item.date, month, year))
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const walletBalance = Math.max(0, walletAmount - monthlySavings - monthlyExpenses);
  const leftoverWallet = currentSavings?.closed_at ? Number(currentSavings.leftover_wallet ?? 0) : walletBalance;
  const totalSavedThisMonth = monthlySavings + leftoverWallet;
  const closedSavingsTotal = savings
    .filter((item) => item.closed_at)
    .reduce((sum, item) => sum + Number(item.total_saved), 0);
  const lifetimeSavings = closedSavingsTotal + (currentSavings?.closed_at ? 0 : totalSavedThisMonth);
  const historyBreakdown = savingsBreakdowns.filter((item) => item.month === month && item.year === year);

  return {
    month,
    year,
    walletAmount,
    walletBalance,
    monthlySavings,
    unusedBudget,
    leftoverWallet,
    totalSavedThisMonth,
    lifetimeSavings,
    monthlyExpenses,
    breakdown,
    historyBreakdown
  };
}

export function useMonthlyStats() {
  const { wallets, transactions, budgets, savings, savingsBreakdowns } = useFinance();
  return getMonthlySavingsStats(wallets, transactions, budgets, savings, savingsBreakdowns);
}
