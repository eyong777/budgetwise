"use client";

import { ArrowDownRight, CalendarDays, Car, CreditCard, ShieldCheck, Utensils, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useFinance, useMonthlyStats } from "@/components/finance-provider";
import { money } from "@/lib/utils";
import { expenseCategories } from "@/lib/constants";
import type { Budget, Currency } from "@/lib/types";

type BudgetRow = Budget & {
  spent: number;
  limit: number;
  remaining: number;
  usage: number;
  over: boolean;
};

function getSyncedBudgets(budgets: Budget[], month: number, year: number) {
  const selected = Array.from(
    new Map(
      [...budgets]
        .sort((a, b) => {
          const aCurrent = a.month === month && a.year === year ? 0 : 1;
          const bCurrent = b.month === month && b.year === year ? 0 : 1;
          return aCurrent - bCurrent || b.year - a.year || b.month - a.month;
        })
        .map((budget) => [budget.category, budget])
    ).values()
  );

  return selected.sort((a, b) => {
    const aIndex = expenseCategories.indexOf(a.category as (typeof expenseCategories)[number]);
    const bIndex = expenseCategories.indexOf(b.category as (typeof expenseCategories)[number]);
    if (aIndex === -1 && bIndex === -1) return a.category.localeCompare(b.category);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

export default function DashboardPage() {
  const { transactions, budgets, currency } = useFinance();
  const activeCurrency = currency as Currency;
  const stats = useMonthlyStats();
  const latest = transactions.slice(0, 5);
  const currentBudgets = getSyncedBudgets(budgets, stats.month, stats.year);
  const monthlyBudget = currentBudgets.reduce((sum, budget) => sum + Number(budget.limit_amount), 0);
  const budgetProgress = monthlyBudget > 0 ? (stats.monthlyExpenses / monthlyBudget) * 100 : 0;
  const budgetRows: BudgetRow[] = currentBudgets.map((budget) => {
    const spent = transactions
      .filter((item) => item.type === "expense" && item.category === budget.category)
      .filter((item) => {
        const date = new Date(item.date);
        return date.getMonth() + 1 === budget.month && date.getFullYear() === budget.year;
      })
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const limit = Number(budget.limit_amount);
    const remaining = Math.max(0, limit - spent);
    const usage = limit > 0 ? (spent / limit) * 100 : 0;
    return { ...budget, spent, limit, remaining, usage, over: spent > limit };
  });
  const totalBudgetRemaining = budgetRows.reduce((sum, budget) => sum + budget.remaining, 0);
  const overBudgetCount = budgetRows.filter((budget) => budget.over).length;

  return (
    <div className="rounded-lg border border-cyan-300/15 bg-[#07111d] p-4 text-slate-100 shadow-[0_28px_80px_rgba(0,0,0,0.22)] sm:p-5">
      <div className="grid gap-5 rounded-lg bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(40,168,107,0.14),transparent_38%),linear-gradient(135deg,#07111d_0%,#0a1826_52%,#040910_100%)] p-4 sm:p-5">
        <section className="grid gap-4 xl:grid-cols-[1fr_280px]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-cyan-200/60">Budget command center</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-white">Budget Health</h1>
            <p className="mt-1 text-sm text-slate-400">Category limits and how much room is left.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <FintechPill icon={CalendarDays} label="Period" value={`${stats.month}/${stats.year}`} />
            <FintechPill icon={Wallet} label="Available Funds" value={money(stats.walletBalance, activeCurrency)} tone="green" />
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.45fr_0.85fr]">
          <DarkPanel>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-black text-white">Budget Utilization</p>
                <p className="mt-1 text-sm text-slate-400">{Math.round(budgetProgress)}% of {money(monthlyBudget, activeCurrency)}</p>
              </div>
              <p className={budgetProgress > 100 ? "text-4xl font-black text-red-300" : "text-4xl font-black text-emerald-300"}>
                {Math.round(budgetProgress)}%
              </p>
            </div>
            <NeonProgress value={budgetProgress} alert={budgetProgress > 100} />
            <div className="mt-6 grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
              <MiniTerminalStat label="Total Budget" value={money(monthlyBudget, activeCurrency)} />
              <MiniTerminalStat label="Spent" value={money(stats.monthlyExpenses, activeCurrency)} tone="red" />
              <MiniTerminalStat label="Remaining" value={money(totalBudgetRemaining, activeCurrency)} tone="green" />
              <MiniTerminalStat label="Daily Burn" value={money(0, activeCurrency)} />
              <MiniTerminalStat label="Forecast" value="On Track" tone="green" />
            </div>
          </DarkPanel>

          <DarkPanel>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-black text-white">Budget Status</p>
                <p className="mt-1 text-sm text-slate-400">Live category health</p>
              </div>
              <span className="grid size-12 place-items-center rounded-full border border-emerald-300/25 bg-emerald-400/10 text-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.18)]">
                <ShieldCheck />
              </span>
            </div>
            <div className="grid gap-2">
              <StatusLine label="Liquidity" value="High" />
              <StatusLine label="Risk" value={overBudgetCount > 0 ? "Review" : "Low"} tone={overBudgetCount > 0 ? "red" : "green"} />
              <StatusLine label="Burn Rate" value="AED 0/day" tone="cyan" />
              <StatusLine label="Health Score" value={overBudgetCount > 0 ? "Watch" : "Excellent"} />
            </div>
          </DarkPanel>
        </section>

        <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
          <div className="grid gap-4 md:grid-cols-2">
            {budgetRows.map((budget) => (
              <CategoryCard key={budget.id} budget={budget} currency={activeCurrency} />
            ))}
            {budgetRows.length === 0 && (
              <DarkPanel className="md:col-span-2">
                <p className="text-sm text-slate-400">Add budgets to see category progress here.</p>
              </DarkPanel>
            )}
          </div>

          <div className="grid gap-4">
            <SpendingTrend />
            <Card className="border-cyan-300/15 bg-white/[0.055] p-4 text-slate-100 shadow-[0_0_34px_rgba(34,211,238,0.06)] backdrop-blur-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-black text-white">Recent Expenses</h2>
                <ArrowDownRight className="text-red-300" size={20} />
              </div>
              <div className="grid gap-3">
                {latest.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] p-3">
                    <div>
                      <p className="font-semibold capitalize text-white">{item.category}</p>
                      <p className="text-sm text-slate-500">{item.description || item.date}</p>
                    </div>
                    <p className="font-bold text-red-300">-{money(item.amount, activeCurrency)}</p>
                  </div>
                ))}
                {latest.length === 0 && (
                  <p className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-400">
                    No expenses yet this month.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}

function FintechPill({ icon: Icon, label, value, tone = "default" }: { icon: LucideIcon; label: string; value: string; tone?: "default" | "green" }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-cyan-300/15 bg-white/[0.055] px-4 py-3 shadow-[0_0_28px_rgba(34,211,238,0.05)] backdrop-blur-xl">
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className={tone === "green" ? "mt-1 text-lg font-black text-emerald-300" : "mt-1 text-lg font-black text-white"}>{value}</p>
      </div>
      <Icon className={tone === "green" ? "text-emerald-300" : "text-cyan-200"} size={22} />
    </div>
  );
}

function CategoryCard({ budget, currency }: { budget: BudgetRow; currency: Currency }) {
  const iconMap: Record<string, LucideIcon> = { food: Utensils, transport: Car };
  const Icon = iconMap[budget.category] ?? CreditCard;

  return (
    <DarkPanel className="p-4">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-full border border-emerald-300/25 bg-emerald-400/10 text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.14)]">
            <Icon size={20} />
          </span>
          <div>
            <h3 className="text-lg font-black capitalize text-white">{budget.category}</h3>
            <p className="text-sm text-slate-400">{budget.month}/{budget.year}</p>
          </div>
        </div>
        <span className={budget.over ? "rounded-full border border-red-300/20 bg-red-400/10 px-3 py-1 text-xs font-bold text-red-300" : "rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300"}>
          {budget.over ? "Over" : "Healthy"}
        </span>
      </div>

      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-2xl font-black text-white">{money(budget.limit, currency)}</p>
          <p className="text-sm text-slate-400">Allocation</p>
        </div>
        <Sparkline alert={budget.over} />
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2 border-y border-white/10 py-4">
        <MiniTerminalStat label="Spent" value={money(budget.spent, currency)} tone={budget.over ? "red" : "default"} />
        <MiniTerminalStat label="Left" value={money(budget.remaining, currency)} tone="green" />
        <MiniTerminalStat label="Limit" value={money(budget.limit, currency)} />
      </div>

      <div className="flex items-center gap-3">
        <NeonProgress value={budget.usage} alert={budget.over} />
        <span className="min-w-9 text-right text-sm font-bold text-white">{Math.round(budget.usage)}%</span>
      </div>
      <p className={budget.over ? "mt-4 text-sm font-semibold text-red-300" : "mt-4 text-sm font-semibold text-emerald-300"}>
        Status: {budget.over ? "Needs Review" : "Healthy Portfolio"}
      </p>
    </DarkPanel>
  );
}

function SpendingTrend() {
  return (
    <DarkPanel>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-white">Spending Trend</h2>
        <span className="rounded-md border border-cyan-300/15 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-slate-300">This Month</span>
      </div>
      <svg viewBox="0 0 340 210" className="h-60 w-full">
        <defs>
          <linearGradient id="dashboardTrend" x1="0" x2="1" y1="0" y2="0">
            <stop stopColor="#34d399" />
            <stop offset="1" stopColor="#22d3ee" />
          </linearGradient>
          <linearGradient id="dashboardTrendFill" x1="0" x2="0" y1="0" y2="1">
            <stop stopColor="#22d3ee" stopOpacity="0.28" />
            <stop offset="1" stopColor="#22d3ee" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[45, 82, 119, 156].map((y) => <line key={y} x1="34" x2="326" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" strokeDasharray="3 3" />)}
        <path d="M34 166 C72 140, 86 104, 120 130 S170 72, 206 104 S260 160, 326 160 L326 184 L34 184 Z" fill="url(#dashboardTrendFill)" />
        <path d="M34 166 C72 140, 86 104, 120 130 S170 72, 206 104 S260 160, 326 160" fill="none" stroke="url(#dashboardTrend)" strokeLinecap="round" strokeWidth="4" />
        {[34, 88, 120, 170, 206, 326].map((x, index) => <circle key={x} cx={x} cy={[166, 110, 130, 86, 104, 160][index]} r="4" fill="#2dd4bf" />)}
      </svg>
    </DarkPanel>
  );
}

function MiniTerminalStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className={tone === "green" ? "mt-1 font-black text-emerald-300" : tone === "red" ? "mt-1 font-black text-red-300" : "mt-1 font-black text-white"}>{value}</p>
    </div>
  );
}

function StatusLine({ label, value, tone = "green" }: { label: string; value: string; tone?: "green" | "cyan" | "red" }) {
  return (
    <div className="flex items-center justify-between border-b border-white/10 py-2 last:border-b-0">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={tone === "green" ? "text-sm font-bold text-emerald-300" : tone === "cyan" ? "text-sm font-bold text-cyan-300" : "text-sm font-bold text-red-300"}>{value}</span>
    </div>
  );
}

function DarkPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <Card className={`rounded-lg border-cyan-300/15 bg-white/[0.055] p-5 text-slate-100 shadow-[0_0_34px_rgba(34,211,238,0.06)] backdrop-blur-xl ${className}`}>
      {children}
    </Card>
  );
}

function NeonProgress({ value, alert }: { value: number; alert?: boolean }) {
  const width = Math.min(100, Math.max(0, value));

  return (
    <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800/80">
      <div
        className={alert ? "h-full rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.55)]" : "h-full rounded-full bg-gradient-to-r from-emerald-300 via-cyan-300 to-blue-500 shadow-[0_0_22px_rgba(45,212,191,0.42)]"}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}

function Sparkline({ alert }: { alert?: boolean }) {
  return (
    <svg viewBox="0 0 116 54" className="h-14 w-28">
      <defs>
        <linearGradient id={alert ? "sparkRed" : "sparkGreen"} x1="0" x2="0" y1="0" y2="1">
          <stop stopColor={alert ? "#f87171" : "#34d399"} stopOpacity="0.35" />
          <stop offset="1" stopColor={alert ? "#f87171" : "#34d399"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M4 42 C18 20, 28 32, 38 18 S58 34, 70 20 S88 10, 112 18 L112 52 L4 52 Z" fill={`url(#${alert ? "sparkRed" : "sparkGreen"})`} />
      <path d="M4 42 C18 20, 28 32, 38 18 S58 34, 70 20 S88 10, 112 18" fill="none" stroke={alert ? "#f87171" : "#34d399"} strokeLinecap="round" strokeWidth="3" />
    </svg>
  );
}
