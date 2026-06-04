"use client";

import { useMemo } from "react";
import { PiggyBank, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFinance, useMonthlyStats } from "@/components/finance-provider";
import { expenseCategories } from "@/lib/constants";
import { money } from "@/lib/utils";
import type { Budget, Currency } from "@/lib/types";

function getSyncedBudgets(budgets: Budget[], month: number, year: number) {
  return Array.from(
    new Map(
      [...budgets]
        .sort((a, b) => {
          const aCurrent = a.month === month && a.year === year ? 0 : 1;
          const bCurrent = b.month === month && b.year === year ? 0 : 1;
          return aCurrent - bCurrent || b.year - a.year || b.month - a.month;
        })
        .map((budget) => [budget.category, budget])
    ).values()
  ).sort((a, b) => {
    const aIndex = expenseCategories.indexOf(a.category as (typeof expenseCategories)[number]);
    const bIndex = expenseCategories.indexOf(b.category as (typeof expenseCategories)[number]);
    if (aIndex === -1 && bIndex === -1) return a.category.localeCompare(b.category);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

export default function ReportsPage() {
  const { transactions, budgets, currency } = useFinance();
  const stats = useMonthlyStats();
  const activeCurrency = currency as Currency;
  const reportLabel = new Date(stats.year, stats.month - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });
  const generatedAt = new Date();

  const currentMonthTransactions = useMemo(() => transactions.filter((item) => {
    const date = new Date(item.date);
    return date.getMonth() + 1 === stats.month && date.getFullYear() === stats.year;
  }), [stats.month, stats.year, transactions]);

  const budgetRows = getSyncedBudgets(budgets, stats.month, stats.year).map((budget) => {
    const spent = currentMonthTransactions
      .filter((item) => item.category === budget.category)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const limit = Number(budget.limit_amount);
    return {
      category: budget.category,
      limit,
      spent,
      left: Math.max(0, limit - spent),
      over: Math.max(0, spent - limit)
    };
  });

  const expenseRows = expenseCategories
    .map((category) => ({
      category,
      amount: currentMonthTransactions
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + Number(item.amount), 0)
    }))
    .filter((item) => item.amount > 0);

  const monthlyBudget = budgetRows.reduce((sum, row) => sum + row.limit, 0);
  const budgetLeft = budgetRows.reduce((sum, row) => sum + row.left, 0);
  const overBudget = budgetRows.reduce((sum, row) => sum + row.over, 0);

  return (
    <div className="grid gap-6">
      <Card className="no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-normal">Monthly Report</h2>
            <p className="mt-1 text-sm text-ink/55 dark:text-white/55">{reportLabel}</p>
          </div>
          <Button type="button" onClick={() => window.print()}>
            <Printer size={16} />
            Print
          </Button>
        </div>
      </Card>

      <Card className="print-report">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-5 dark:border-white/10">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-mint text-white">
                <PiggyBank size={20} />
              </span>
              <span className="text-lg font-black">BudgetWise</span>
            </div>
            <h1 className="text-3xl font-black tracking-normal">Monthly Financial Report</h1>
            <p className="mt-1 text-sm text-ink/55 dark:text-white/55">{reportLabel}</p>
          </div>
          <p className="text-sm text-ink/55 dark:text-white/55">Generated {generatedAt.toLocaleString()}</p>
        </div>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <ReportMetric label="Available Balance" value={money(stats.walletBalance, activeCurrency)} tone="green" />
          <ReportMetric label="Monthly Budget" value={money(monthlyBudget, activeCurrency)} />
          <ReportMetric label="Expenses This Month" value={money(stats.monthlyExpenses, activeCurrency)} tone="red" />
          <ReportMetric label="Total Saved This Month" value={money(stats.totalSavedThisMonth, activeCurrency)} tone="green" />
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <SmallMetric label="Budget Left" value={money(budgetLeft, activeCurrency)} tone="green" />
          <SmallMetric label="Over Budget" value={money(overBudget, activeCurrency)} tone={overBudget > 0 ? "red" : "green"} />
          <SmallMetric label="Mandatory Savings" value={money(stats.monthlySavings, activeCurrency)} tone="green" />
        </section>

        <section className="report-section mt-6">
          <h2 className="mb-3 text-lg font-black">Budget Details</h2>
          <ReportTable>
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-right">Limit</th>
                <th className="text-right">Spent</th>
                <th className="text-right">Left</th>
              </tr>
            </thead>
            <tbody>
              {budgetRows.map((row) => (
                <tr key={row.category}>
                  <td className="capitalize">{row.category}</td>
                  <td className="text-right">{money(row.limit, activeCurrency)}</td>
                  <td className="text-right">{money(row.spent, activeCurrency)}</td>
                  <td className="text-right">{money(row.left, activeCurrency)}</td>
                </tr>
              ))}
              {budgetRows.length === 0 && <EmptyTableRow colSpan={4} text="No budgets added." />}
            </tbody>
          </ReportTable>
        </section>

        <section className="report-section mt-6">
          <h2 className="mb-3 text-lg font-black">Expenses by Category</h2>
          <ReportTable>
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {expenseRows.map((row) => (
                <tr key={row.category}>
                  <td className="capitalize">{row.category}</td>
                  <td className="text-right">{money(row.amount, activeCurrency)}</td>
                </tr>
              ))}
              {expenseRows.length === 0 && <EmptyTableRow colSpan={2} text="No expenses this month." />}
            </tbody>
          </ReportTable>
        </section>

        <footer className="report-footer mt-8 flex items-center justify-between border-t border-ink/10 pt-4 text-xs text-ink/50 dark:border-white/10 dark:text-white/50">
          <span>BudgetWise Report</span>
          <span>{reportLabel}</span>
          <span>Page 1</span>
        </footer>
      </Card>
    </div>
  );
}

function ReportMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div className="rounded-xl border border-white/60 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[0.06]">
      <p className="text-sm text-ink/55 dark:text-white/55">{label}</p>
      <p className={tone === "green" ? "mt-1 text-2xl font-black text-mint" : tone === "red" ? "mt-1 text-2xl font-black text-coral" : "mt-1 text-2xl font-black"}>{value}</p>
    </div>
  );
}

function SmallMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div className="rounded-lg bg-ink/[0.03] p-3 dark:bg-white/[0.06]">
      <p className="text-xs font-bold uppercase text-ink/45 dark:text-white/45">{label}</p>
      <p className={tone === "green" ? "mt-1 text-lg font-black text-mint" : tone === "red" ? "mt-1 text-lg font-black text-coral" : "mt-1 text-lg font-black"}>{value}</p>
    </div>
  );
}

function ReportTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-white/55 bg-white/45 dark:border-white/10 dark:bg-white/[0.04]">
      <table className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

function EmptyTableRow({ colSpan, text }: { colSpan: number; text: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center text-ink/55 dark:text-white/55">{text}</td>
    </tr>
  );
}
