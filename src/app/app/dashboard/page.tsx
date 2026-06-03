"use client";

import { ArrowDownRight, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFinance, useMonthlyStats } from "@/components/finance-provider";
import { money } from "@/lib/utils";
import type { Currency } from "@/lib/types";

export default function DashboardPage() {
  const { transactions, budgets, currency } = useFinance();
  const activeCurrency = currency as Currency;
  const stats = useMonthlyStats();
  const latest = transactions.slice(0, 5);
  const currentBudgets = Array.from(
    new Map(
      [...budgets]
        .sort((a, b) => {
          const aCurrent = a.month === stats.month && a.year === stats.year ? 0 : 1;
          const bCurrent = b.month === stats.month && b.year === stats.year ? 0 : 1;
          return aCurrent - bCurrent || b.year - a.year || b.month - a.month;
        })
        .map((budget) => [budget.category, budget])
    ).values()
  );

  return (
    <div className="grid gap-6">
      <section>
        <Card className="overflow-hidden p-0">
          <div className="bg-ink p-6 text-white dark:bg-white dark:text-ink">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm opacity-70">Available Balance</p>
                <h2 className="mt-3 text-4xl font-black tracking-normal sm:text-5xl">{money(stats.walletBalance, activeCurrency)}</h2>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-white/10 dark:bg-ink/10">
                <Wallet />
              </span>
            </div>
          </div>
          <div className="grid gap-3 p-4 sm:grid-cols-2">
            <MiniMetric label="Monthly Savings" value={money(stats.monthlySavings, activeCurrency)} tone="green" />
            <MiniMetric label="Expenses This Month" value={money(stats.monthlyExpenses, activeCurrency)} tone="red" />
          </div>
        </Card>
      </section>

      <Card>
        <h2 className="mb-3 text-lg font-bold">How the Numbers Work</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <FormulaStep label="Available Balance" value={`${money(stats.walletAmount, activeCurrency)} - ${money(stats.monthlySavings, activeCurrency)} - ${money(stats.monthlyExpenses, activeCurrency)} = ${money(stats.walletBalance, activeCurrency)}`} />
          <FormulaStep label="Saved This Month" value={`${money(stats.monthlySavings, activeCurrency)} + ${money(stats.leftoverWallet, activeCurrency)} = ${money(stats.totalSavedThisMonth, activeCurrency)}`} />
          <FormulaStep label="Budget Left" value="Budget limits explain where money was not spent. They do not create extra money." />
          <FormulaStep label="At Month Close" value="Real leftover wallet money moves into savings history." />
        </div>
      </Card>

      <section>
        <Card>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Budget Health</h2>
              <p className="text-sm text-ink/55 dark:text-white/55">Budgets are spending limits. They do not add money to wallets.</p>
            </div>
            <span className="rounded-md bg-mint/10 px-3 py-2 text-sm font-bold text-mint">
              Budget Left {money(stats.unusedBudget, activeCurrency)}
            </span>
          </div>
          <div className="grid gap-4">
            {currentBudgets.map((budget) => {
              const spent = transactions
                .filter((item) => item.category === budget.category)
                .filter((item) => {
                  const date = new Date(item.date);
                  return date.getMonth() + 1 === budget.month && date.getFullYear() === budget.year;
                })
                .reduce((sum, item) => sum + Number(item.amount), 0);
              const remaining = Math.max(0, Number(budget.limit_amount) - spent);
              const usage = (spent / Number(budget.limit_amount)) * 100;
              return (
                <div key={budget.id} className="grid gap-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-semibold capitalize">{budget.category}</span>
                    <span className={usage > 100 ? "font-semibold text-coral" : "text-ink/55 dark:text-white/55"}>
                      {money(spent, activeCurrency)} spent · {money(remaining, activeCurrency)} left
                    </span>
                  </div>
                  <Progress value={usage} alert={usage > 100} />
                </div>
              );
            })}
            {currentBudgets.length === 0 && (
              <p className="rounded-md bg-ink/[0.03] p-4 text-sm text-ink/60 dark:bg-white/[0.06] dark:text-white/60">
                Add budgets for this month to see category progress here.
              </p>
            )}
          </div>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Savings Breakdown</h2>
          <SavingsBreakdown stats={stats} currency={activeCurrency} />
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">Recent Expenses</h2>
            <ArrowDownRight className="text-coral" size={20} />
          </div>
          <div className="grid gap-3">
            {latest.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-md border border-ink/10 p-3 dark:border-white/10">
                <div>
                  <p className="font-semibold capitalize">{item.category}</p>
                  <p className="text-sm text-ink/50 dark:text-white/50">{item.description || item.date}</p>
                </div>
                <p className="font-bold text-coral">-{money(item.amount, activeCurrency)}</p>
              </div>
            ))}
            {latest.length === 0 && (
              <p className="rounded-md bg-ink/[0.03] p-4 text-sm text-ink/60 dark:bg-white/[0.06] dark:text-white/60">
                No expenses yet this month.
              </p>
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}

function SavingsBreakdown({ stats, currency }: { stats: ReturnType<typeof useMonthlyStats>; currency: Currency }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-ink/10 p-4 dark:border-white/10">
          <p className="text-sm text-ink/60 dark:text-white/60">Monthly Savings</p>
          <p className="mt-1 text-xl font-black text-mint">{money(stats.monthlySavings, currency)}</p>
        </div>
        <div className="rounded-md border border-ink/10 p-4 dark:border-white/10">
          <p className="text-sm text-ink/60 dark:text-white/60">Monthly Budget</p>
          <p className="mt-1 text-xl font-black">{money(stats.unusedBudget, currency)}</p>
        </div>
        <div className="rounded-md border border-ink/10 p-4 dark:border-white/10">
          <p className="text-sm text-ink/60 dark:text-white/60">Available Balance</p>
          <p className="mt-1 text-xl font-black">{money(stats.leftoverWallet, currency)}</p>
        </div>
      </div>
      <div className="rounded-md bg-mint/10 p-4">
        <p className="text-sm text-ink/60 dark:text-white/60">Final Total Saved This Month</p>
        <p className="mt-1 text-2xl font-black text-mint">{money(stats.totalSavedThisMonth, currency)}</p>
      </div>
    </div>
  );
}

function MiniMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div className="rounded-md border border-ink/10 p-4 dark:border-white/10">
      <p className="text-sm text-ink/55 dark:text-white/55">{label}</p>
      <p className={tone === "green" ? "mt-1 text-xl font-black text-mint" : tone === "red" ? "mt-1 text-xl font-black text-coral" : "mt-1 text-xl font-black"}>{value}</p>
    </div>
  );
}

function FormulaStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-ink/[0.03] p-4 dark:bg-white/[0.06]">
      <p className="text-sm font-bold">{label}</p>
      <p className="mt-2 text-sm text-ink/60 dark:text-white/60">{value}</p>
    </div>
  );
}
