"use client";

import {
  Activity,
  BarChart3,
  CircleDollarSign,
  Gauge,
  Goal,
  LayoutDashboard,
  PieChart,
  ReceiptText,
  Settings,
  ShieldCheck,
  TrendingUp,
  Utensils,
  Wallet,
  Waypoints
} from "lucide-react";
import { useFinance, useMonthlyStats } from "@/components/finance-provider";
import { expenseCategories } from "@/lib/constants";
import { money } from "@/lib/utils";
import type { Budget, Currency } from "@/lib/types";

type BudgetRow = Budget & {
  spent: number;
  limit: number;
  remaining: number;
  usage: number;
  over: boolean;
};

const terminalNav = [
  { label: "Overview", icon: LayoutDashboard },
  { label: "Categories", icon: PieChart },
  { label: "Transactions", icon: ReceiptText },
  { label: "Analytics", icon: BarChart3 },
  { label: "Goals", icon: Goal },
  { label: "Reports", icon: Activity },
  { label: "Settings", icon: Settings }
];

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
  const currentBudgets = getSyncedBudgets(budgets, stats.month, stats.year);
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
  const totalBudget = budgetRows.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = budgetRows.reduce((sum, budget) => sum + budget.spent, 0);
  const totalRemaining = budgetRows.reduce((sum, budget) => sum + budget.remaining, 0);
  const overallUse = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const avgDailySpend = totalSpent / Math.max(1, new Date().getDate());
  const savingsRate = stats.walletAmount > 0 ? (stats.monthlySavings / stats.walletAmount) * 100 : 0;

  return (
    <div className="overflow-hidden rounded-lg border border-cyan-300/15 bg-[#061019] text-slate-100 shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
      <div className="grid min-h-[760px] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(40,168,107,0.16),transparent_36%),linear-gradient(135deg,#050b12_0%,#081827_52%,#02060a_100%)] lg:grid-cols-[240px_1fr]">
        <TerminalSidebar />
        <main className="grid gap-5 p-4 sm:p-6">
          <HeaderPanel month={stats.month} year={stats.year} available={money(stats.walletBalance, activeCurrency)} />

          <section className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
            <OverviewPanel
              budgetUse={overallUse}
              totalBudget={money(totalBudget, activeCurrency)}
              spent={money(totalSpent, activeCurrency)}
              remaining={money(totalRemaining, activeCurrency)}
              dailyBurn={money(avgDailySpend, activeCurrency)}
              forecast={money(totalSpent, activeCurrency)}
            />
            <BudgetStatus spent={totalSpent} overCount={budgetRows.filter((row) => row.over).length} />
          </section>

          <section className="grid gap-4 xl:grid-cols-[1fr_360px]">
            <div className="grid gap-4 md:grid-cols-2">
              {budgetRows.map((budget) => (
                <CategoryCard key={budget.id} budget={budget} currency={activeCurrency} />
              ))}
              {budgetRows.length === 0 && (
                <GlassPanel className="md:col-span-2">
                  <p className="text-sm text-slate-400">No budget categories yet.</p>
                </GlassPanel>
              )}
            </div>
            <SpendingTrend />
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Transactions" value={String(transactions.length)} />
            <StatCard label="Avg. Daily Spend" value={money(avgDailySpend, activeCurrency)} tone="cyan" />
            <StatCard label="Savings Rate" value={`${Math.round(savingsRate)}%`} tone="green" />
          </section>
        </main>
      </div>
    </div>
  );
}

function TerminalSidebar() {
  return (
    <aside className="border-b border-cyan-300/10 bg-black/20 p-4 backdrop-blur-xl lg:border-b-0 lg:border-r">
      <div className="mb-6 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-lg border border-emerald-300/30 bg-emerald-400/15 text-emerald-300 shadow-[0_0_24px_rgba(16,185,129,0.18)]">
          <Wallet size={22} />
        </span>
        <div>
          <p className="font-black tracking-normal text-white">BudgetWise</p>
          <p className="text-xs uppercase tracking-widest text-cyan-200/55">Terminal</p>
        </div>
      </div>
      <nav className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-1">
        {terminalNav.map((item, index) => {
          const Icon = item.icon;
          const active = index === 0;
          return (
            <button
              key={item.label}
              type="button"
              className={active ? "flex h-11 items-center gap-3 rounded-md border border-emerald-300/30 bg-emerald-400/15 px-3 text-sm font-bold text-emerald-200 shadow-[0_0_22px_rgba(16,185,129,0.12)]" : "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-semibold text-slate-400 transition hover:bg-white/5 hover:text-cyan-100"}
            >
              <Icon size={17} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function HeaderPanel({ month, year, available }: { month: number; year: number; available: string }) {
  const monthName = new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(year, month - 1, 1));

  return (
    <header className="grid gap-4 xl:grid-cols-[1fr_320px]">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200/60">Risk-managed spending</p>
        <h1 className="mt-2 text-3xl font-black tracking-normal text-white sm:text-4xl">Budget Health</h1>
        <p className="mt-2 text-sm text-slate-400">Category limits and how much room is left.</p>
      </div>
      <GlassPanel className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-cyan-200/55">Available Funds</p>
            <p className="mt-2 text-3xl font-black text-emerald-300">{available}</p>
          </div>
          <span className="rounded-md border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 text-sm font-bold text-cyan-100">{monthName} {year}</span>
        </div>
      </GlassPanel>
    </header>
  );
}

function OverviewPanel({ budgetUse, totalBudget, spent, remaining, dailyBurn, forecast }: { budgetUse: number; totalBudget: string; spent: string; remaining: string; dailyBurn: string; forecast: string }) {
  return (
    <GlassPanel>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-200/55">Budget Utilization</p>
          <p className="mt-2 text-4xl font-black text-white">{Math.round(budgetUse)}%</p>
        </div>
        <Gauge className="text-cyan-300" />
      </div>
      <TerminalProgress value={budgetUse} />
      <p className="mt-3 text-sm text-slate-400">{Math.round(budgetUse)}% of {totalBudget}</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-5">
        <MiniStat label="Total Budget" value={totalBudget} />
        <MiniStat label="Spent" value={spent} tone="red" />
        <MiniStat label="Remaining" value={remaining} tone="green" />
        <MiniStat label="Daily Burn" value={dailyBurn} tone="cyan" />
        <MiniStat label="Forecast" value={forecast} />
      </div>
    </GlassPanel>
  );
}

function BudgetStatus({ spent, overCount }: { spent: number; overCount: number }) {
  const risk = overCount > 0 ? "Elevated" : "Low";
  const liquidity = spent > 0 ? "Stable" : "High";

  return (
    <GlassPanel>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-200/55">Budget Status</p>
          <h2 className="mt-2 text-xl font-black text-white">Excellent</h2>
        </div>
        <ShieldCheck className="text-emerald-300" />
      </div>
      <div className="grid gap-3">
        <StatusLine label="Liquidity" value={liquidity} tone="green" />
        <StatusLine label="Risk" value={risk} tone={overCount > 0 ? "red" : "green"} />
        <StatusLine label="Burn Rate" value="AED 0/day" tone="cyan" />
        <StatusLine label="Health Score" value="Excellent" tone="green" />
      </div>
    </GlassPanel>
  );
}

function CategoryCard({ budget, currency }: { budget: BudgetRow; currency: Currency }) {
  const Icon = budget.category === "food" ? Utensils : budget.category === "transport" ? Waypoints : CircleDollarSign;

  return (
    <GlassPanel className="p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
            <Icon size={20} />
          </span>
          <div>
            <h3 className="font-black capitalize text-white">{budget.category}</h3>
            <p className="text-xs text-slate-500">{budget.month}/{budget.year}</p>
          </div>
        </div>
        <span className={budget.over ? "rounded-md border border-red-300/20 bg-red-400/10 px-2 py-1 text-xs font-bold text-red-300" : "rounded-md border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-xs font-bold text-emerald-300"}>
          {budget.over ? "Over" : "Healthy"}
        </span>
      </div>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-slate-500">Allocation</p>
          <p className="mt-1 text-2xl font-black text-white">{money(budget.limit, currency)}</p>
        </div>
        <Sparkline alert={budget.over} />
      </div>
      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <MiniStat label="Spent" value={money(budget.spent, currency)} tone={budget.over ? "red" : "default"} />
        <MiniStat label="Left" value={money(budget.remaining, currency)} tone="green" />
        <MiniStat label="Limit" value={money(budget.limit, currency)} />
      </div>
      <TerminalProgress value={budget.usage} alert={budget.over} />
      <p className="mt-3 text-xs font-semibold text-emerald-300">{budget.over ? "Needs review" : "Healthy Portfolio"}</p>
    </GlassPanel>
  );
}

function SpendingTrend() {
  return (
    <GlassPanel>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-cyan-200/55">Spending Trend</p>
          <h2 className="mt-2 text-xl font-black text-white">Flat market</h2>
        </div>
        <TrendingUp className="text-cyan-300" />
      </div>
      <svg viewBox="0 0 320 180" className="h-56 w-full">
        <defs>
          <linearGradient id="trendGlow" x1="0" x2="1" y1="0" y2="0">
            <stop stopColor="#22d3ee" />
            <stop offset="1" stopColor="#34d399" />
          </linearGradient>
        </defs>
        {[35, 70, 105, 140].map((y) => <line key={y} x1="0" x2="320" y1={y} y2={y} stroke="rgba(148,163,184,0.14)" />)}
        <polyline points="8,138 56,136 104,139 152,137 200,138 248,136 312,137" fill="none" stroke="url(#trendGlow)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="312" cy="137" r="5" fill="#34d399" />
      </svg>
    </GlassPanel>
  );
}

function StatCard({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "cyan" }) {
  return (
    <GlassPanel className="p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={tone === "green" ? "mt-2 text-2xl font-black text-emerald-300" : tone === "cyan" ? "mt-2 text-2xl font-black text-cyan-300" : "mt-2 text-2xl font-black text-white"}>{value}</p>
    </GlassPanel>
  );
}

function MiniStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "cyan" | "red" }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</p>
      <p className={tone === "green" ? "mt-1 text-sm font-black text-emerald-300" : tone === "cyan" ? "mt-1 text-sm font-black text-cyan-300" : tone === "red" ? "mt-1 text-sm font-black text-red-300" : "mt-1 text-sm font-black text-white"}>{value}</p>
    </div>
  );
}

function StatusLine({ label, value, tone }: { label: string; value: string; tone: "green" | "cyan" | "red" }) {
  return (
    <div className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.03] px-3 py-2">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={tone === "green" ? "text-sm font-bold text-emerald-300" : tone === "cyan" ? "text-sm font-bold text-cyan-300" : "text-sm font-bold text-red-300"}>{value}</span>
    </div>
  );
}

function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-cyan-300/15 bg-white/[0.055] p-5 shadow-[0_0_34px_rgba(34,211,238,0.06)] backdrop-blur-xl ${className}`}>
      {children}
    </div>
  );
}

function TerminalProgress({ value, alert }: { value: number; alert?: boolean }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-slate-800/80">
      <div
        className={alert ? "h-full rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.55)]" : "h-full rounded-full bg-gradient-to-r from-cyan-300 to-emerald-300 shadow-[0_0_18px_rgba(45,212,191,0.42)]"}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function Sparkline({ alert }: { alert?: boolean }) {
  return (
    <svg viewBox="0 0 92 38" className="h-10 w-24">
      <polyline points="2,25 18,24 34,25 50,23 66,24 90,22" fill="none" stroke={alert ? "#f87171" : "#22d3ee"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="2,34 18,33 34,34 50,32 66,33 90,31" fill="none" stroke={alert ? "rgba(248,113,113,0.18)" : "rgba(52,211,153,0.22)"} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
