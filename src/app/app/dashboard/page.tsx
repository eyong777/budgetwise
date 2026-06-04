"use client";

import { ArrowDownRight, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useFinance, useMonthlyStats } from "@/components/finance-provider";
import { money } from "@/lib/utils";
import { expenseCategories } from "@/lib/constants";
import type { Budget, Currency } from "@/lib/types";

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
  const budgetRows = currentBudgets.map((budget) => {
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
          <div className="grid gap-3 p-4 sm:grid-cols-3">
            <MiniMetric label="Mandatory Monthly Savings" value={money(stats.monthlySavings, activeCurrency)} tone="green" />
            <MiniMetric label="Monthly Budget" value={money(monthlyBudget, activeCurrency)} />
            <MiniMetric label="Expenses This Month" value={money(stats.monthlyExpenses, activeCurrency)} tone="red" />
          </div>
        </Card>
      </section>

      <section>
        <Card>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">Budget Health</h2>
              <p className="text-sm text-ink/55 dark:text-white/55">Monthly category limits with spending progress.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-mint/10 px-3 py-2 text-sm font-bold text-mint">
                {money(totalBudgetRemaining, activeCurrency)} left
              </span>
              {overBudgetCount > 0 && (
                <span className="rounded-md bg-coral/10 px-3 py-2 text-sm font-bold text-coral">
                  {overBudgetCount} over budget
                </span>
              )}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {budgetRows.map((budget) => {
              return (
                <div key={budget.id} className="rounded-md border border-white/55 bg-white/45 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/[0.06]">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold capitalize">{budget.category}</p>
                      <p className="mt-1 text-xs text-ink/50 dark:text-white/50">{budget.month}/{budget.year}</p>
                    </div>
                    <span className={budget.over ? "rounded-md bg-coral/10 px-2 py-1 text-xs font-bold text-coral" : "rounded-md bg-mint/10 px-2 py-1 text-xs font-bold text-mint"}>
                      {budget.over ? "Over" : "Healthy"}
                    </span>
                  </div>
                  <Progress value={budget.usage} alert={budget.over} />
                  <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-ink/45 dark:text-white/45">Limit</p>
                      <p className="font-bold">{money(budget.limit, activeCurrency)}</p>
                    </div>
                    <div>
                      <p className="text-ink/45 dark:text-white/45">Spent</p>
                      <p className={budget.over ? "font-bold text-coral" : "font-bold"}>{money(budget.spent, activeCurrency)}</p>
                    </div>
                    <div>
                      <p className="text-ink/45 dark:text-white/45">Left</p>
                      <p className="font-bold text-mint">{money(budget.remaining, activeCurrency)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
            {budgetRows.length === 0 && (
              <p className="rounded-md bg-ink/[0.03] p-4 text-sm text-ink/60 dark:bg-white/[0.06] dark:text-white/60">
                Add budgets to see category progress here.
              </p>
            )}
          </div>
        </Card>
      </section>

      <section>
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

function MiniMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div className="rounded-md border border-ink/10 p-4 dark:border-white/10">
      <p className="text-sm text-ink/55 dark:text-white/55">{label}</p>
      <p className={tone === "green" ? "mt-1 text-xl font-black text-mint" : tone === "red" ? "mt-1 text-xl font-black text-coral" : "mt-1 text-xl font-black"}>{value}</p>
    </div>
  );
}
