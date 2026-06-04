"use client";

import { useMemo } from "react";
import { CreditCard, PiggyBank, Printer, ReceiptText, Wallet } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFinance, useMonthlyStats } from "@/components/finance-provider";
import { expenseCategories } from "@/lib/constants";
import { money } from "@/lib/utils";
import type { Budget, Currency } from "@/lib/types";

const chartColors = ["#28a86b", "#e25555", "#14b8a6", "#f59e0b", "#8b5cf6", "#3b82f6", "#64748b", "#84cc16", "#ef4444"];

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
  const { transactions, budgets, savings, wallets, currency } = useFinance();
  const stats = useMonthlyStats();
  const activeCurrency = currency as Currency;
  const generatedAt = new Date();
  const reportDate = new Date(stats.year, stats.month - 1, 1);
  const reportLabel = reportDate.toLocaleString(undefined, { month: "long", year: "numeric" });
  const currentBudgets = getSyncedBudgets(budgets, stats.month, stats.year);

  const currentMonthTransactions = useMemo(() => transactions.filter((item) => {
    const date = new Date(item.date);
    return date.getMonth() + 1 === stats.month && date.getFullYear() === stats.year;
  }), [stats.month, stats.year, transactions]);

  const budgetRows = currentBudgets.map((budget) => {
    const spent = currentMonthTransactions
      .filter((item) => item.category === budget.category)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const limit = Number(budget.limit_amount);
    return {
      category: budget.category,
      limit,
      spent,
      left: Math.max(0, limit - spent),
      over: Math.max(0, spent - limit),
      use: limit > 0 ? Math.min(100, (spent / limit) * 100) : 0
    };
  });

  const monthlyBudget = budgetRows.reduce((sum, row) => sum + row.limit, 0);
  const budgetSpent = budgetRows.reduce((sum, row) => sum + row.spent, 0);
  const budgetLeft = budgetRows.reduce((sum, row) => sum + row.left, 0);
  const overBudget = budgetRows.reduce((sum, row) => sum + row.over, 0);
  const budgetUse = monthlyBudget > 0 ? (budgetSpent / monthlyBudget) * 100 : 0;

  const expenseRows = expenseCategories
    .map((category) => ({
      category,
      amount: currentMonthTransactions
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + Number(item.amount), 0)
    }))
    .filter((item) => item.amount > 0);

  const highestExpense = expenseRows.length
    ? expenseRows.reduce((highest, row) => row.amount > highest.amount ? row : highest, expenseRows[0])
    : null;

  const yearlyRows = useMemo(() => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      label: new Date(stats.year, index, 1).toLocaleString(undefined, { month: "short" }),
      expenses: 0,
      budget: 0,
      saved: 0
    }));

    transactions.forEach((item) => {
      const date = new Date(item.date);
      if (date.getFullYear() === stats.year) rows[date.getMonth()].expenses += Number(item.amount);
    });

    budgets.forEach((budget) => {
      if (budget.year === stats.year) rows[budget.month - 1].budget += Number(budget.limit_amount);
    });

    savings.forEach((saving) => {
      if (saving.year === stats.year) rows[saving.month - 1].saved += Number(saving.total_saved);
    });

    return rows;
  }, [budgets, savings, stats.year, transactions]);

  const savingsGrowth = yearlyRows.map((row, index) => ({
    ...row,
    lifetime: yearlyRows.slice(0, index + 1).reduce((sum, item) => sum + item.saved, 0)
  }));

  return (
    <div className="grid gap-6">
      <Card className="no-print">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black tracking-normal">Reports</h2>
            <p className="mt-1 text-sm text-ink/55 dark:text-white/55">{reportLabel} financial snapshot</p>
          </div>
          <Button type="button" onClick={() => window.print()}>
            <Printer size={16} />
            Print Report
          </Button>
        </div>
      </Card>

      <section className="no-print grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard icon={Wallet} label="Available Balance" value={money(stats.walletBalance, activeCurrency)} tone="green" />
        <MetricCard icon={CreditCard} label="Monthly Budget" value={money(monthlyBudget, activeCurrency)} />
        <MetricCard icon={ReceiptText} label="Expenses This Month" value={money(stats.monthlyExpenses, activeCurrency)} tone="red" />
        <MetricCard icon={PiggyBank} label="Total Saved This Month" value={money(stats.totalSavedThisMonth, activeCurrency)} tone="green" />
      </section>

      <section className="no-print grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h3 className="text-lg font-black">Budget Overview</h3>
              <p className="text-sm text-ink/55 dark:text-white/55">Budgets are spending limits. They do not add money.</p>
            </div>
            <p className="text-sm font-bold text-ink/55 dark:text-white/55">{budgetUse.toFixed(1)}% used</p>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <SmallStat label="Budget Limit" value={money(monthlyBudget, activeCurrency)} />
            <SmallStat label="Spent" value={money(budgetSpent, activeCurrency)} tone="red" />
            <SmallStat label="Still Available" value={money(budgetLeft, activeCurrency)} tone="green" />
            <SmallStat label="Over Budget" value={money(overBudget, activeCurrency)} tone={overBudget > 0 ? "red" : "green"} />
          </div>
          <div className="mt-4 grid gap-2">
            {budgetRows.map((row) => (
              <div key={row.category} className="rounded-lg border border-white/60 bg-white/55 p-3 dark:border-white/10 dark:bg-white/[0.06]">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-bold capitalize">{row.category}</p>
                  <p className="text-sm text-ink/55 dark:text-white/55">{money(row.spent, activeCurrency)} / {money(row.limit, activeCurrency)}</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
                  <div className={row.over > 0 ? "h-full rounded-full bg-coral" : "h-full rounded-full bg-mint"} style={{ width: `${row.use}%` }} />
                </div>
              </div>
            ))}
            {budgetRows.length === 0 && <EmptyBox text="No budgets yet." />}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-black">Savings Snapshot</h3>
          <div className="mt-4 grid gap-3">
            <SmallStat label="Mandatory Savings" value={money(stats.monthlySavings, activeCurrency)} tone="green" />
            <SmallStat label="Available Balance" value={money(stats.walletBalance, activeCurrency)} tone="green" />
            <SmallStat label="Total Saved This Month" value={money(stats.totalSavedThisMonth, activeCurrency)} tone="green" />
            <SmallStat label="Lifetime Savings" value={money(stats.lifetimeSavings, activeCurrency)} />
          </div>
        </Card>
      </section>

      <section className="no-print grid gap-6 xl:grid-cols-2">
        <ChartCard title="Monthly Budget vs Expenses">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={yearlyRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.16)" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => money(value, activeCurrency)} />
              <Bar dataKey="budget" fill="#28a86b" radius={[5, 5, 0, 0]} name="Budget" />
              <Bar dataKey="expenses" fill="#e25555" radius={[5, 5, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expenses by Category">
          {expenseRows.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={expenseRows} dataKey="amount" nameKey="category" outerRadius={96} label>
                  {expenseRows.map((_, index) => <Cell key={index} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip formatter={(value: number) => money(value, activeCurrency)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyBox text="No expenses this month." />
          )}
        </ChartCard>

        <ChartCard title="Spending Trend">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={yearlyRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.16)" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => money(value, activeCurrency)} />
              <Area type="monotone" dataKey="expenses" stroke="#e25555" fill="#e2555530" name="Expenses" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Savings Growth">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={savingsGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.16)" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => money(value, activeCurrency)} />
              <Area type="monotone" dataKey="lifetime" stroke="#28a86b" fill="#28a86b33" name="Savings" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <Card className="print-report">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-5 dark:border-white/10">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-mint text-white">
                <PiggyBank />
              </span>
              <span className="text-xl font-black">BudgetWise</span>
            </div>
            <h2 className="text-3xl font-black tracking-normal">Monthly Financial Report</h2>
            <p className="mt-1 text-sm text-ink/55 dark:text-white/55">Report period: {reportLabel}</p>
          </div>
          <div className="text-sm text-ink/55 dark:text-white/55">
            Generated {generatedAt.toLocaleString()}
          </div>
        </div>

        <ReportSection title="Summary">
          <div className="grid gap-3 md:grid-cols-4">
            <ReportMetric label="Available Balance" value={money(stats.walletBalance, activeCurrency)} tone="green" />
            <ReportMetric label="Monthly Budget" value={money(monthlyBudget, activeCurrency)} />
            <ReportMetric label="Expenses This Month" value={money(stats.monthlyExpenses, activeCurrency)} tone="red" />
            <ReportMetric label="Total Saved This Month" value={money(stats.totalSavedThisMonth, activeCurrency)} tone="green" />
          </div>
        </ReportSection>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <ReportTable title="Budget Details">
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-right">Limit</th>
                <th className="text-right">Spent</th>
                <th className="text-right">Left</th>
                <th className="text-right">Over</th>
              </tr>
            </thead>
            <tbody>
              {budgetRows.map((row) => (
                <tr key={row.category}>
                  <td className="capitalize">{row.category}</td>
                  <td className="text-right">{money(row.limit, activeCurrency)}</td>
                  <td className="text-right">{money(row.spent, activeCurrency)}</td>
                  <td className="text-right">{money(row.left, activeCurrency)}</td>
                  <td className="text-right">{money(row.over, activeCurrency)}</td>
                </tr>
              ))}
              {budgetRows.length === 0 && <EmptyTableRow colSpan={5} text="No budgets added." />}
            </tbody>
          </ReportTable>

          <ReportTable title="Expenses by Category">
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
        </div>

        <ReportSection title="Wallets and Savings">
          <div className="grid gap-3 md:grid-cols-4">
            <ReportMetric label="Wallet Amount" value={money(stats.walletAmount, activeCurrency)} />
            <ReportMetric label="Available Balance" value={money(stats.walletBalance, activeCurrency)} tone="green" />
            <ReportMetric label="Mandatory Savings" value={money(stats.monthlySavings, activeCurrency)} tone="green" />
            <ReportMetric label="Lifetime Savings" value={money(stats.lifetimeSavings, activeCurrency)} />
          </div>
        </ReportSection>

        <ReportSection title="Expense Details">
          <ReportTable title="Transactions">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {currentMonthTransactions.map((item) => (
                <tr key={item.id}>
                  <td>{item.date}</td>
                  <td className="capitalize">{item.category}</td>
                  <td>{item.description || "-"}</td>
                  <td className="text-right">{money(item.amount, activeCurrency)}</td>
                </tr>
              ))}
              {currentMonthTransactions.length === 0 && <EmptyTableRow colSpan={4} text="No expenses this month." />}
            </tbody>
          </ReportTable>
        </ReportSection>

        <ReportSection title="Key Notes">
          <div className="grid gap-3 md:grid-cols-3">
            <ReportMetric label="Highest Expense" value={highestExpense ? highestExpense.category : "None"} />
            <ReportMetric label="Highest Expense Amount" value={highestExpense ? money(highestExpense.amount, activeCurrency) : money(0, activeCurrency)} />
            <ReportMetric label="Budget Used" value={`${budgetUse.toFixed(1)}%`} />
          </div>
        </ReportSection>

        <footer className="report-footer mt-8 flex items-center justify-between border-t border-ink/10 pt-4 text-xs text-ink/50 dark:border-white/10 dark:text-white/50">
          <span>BudgetWise Monthly Financial Report</span>
          <span>Generated {generatedAt.toLocaleString()}</span>
          <span>Page 1</span>
        </footer>
      </Card>
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, tone = "default" }: { icon: React.ElementType; label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink/55 dark:text-white/55">{label}</p>
          <p className={tone === "green" ? "mt-2 text-2xl font-black text-mint" : tone === "red" ? "mt-2 text-2xl font-black text-coral" : "mt-2 text-2xl font-black"}>{value}</p>
        </div>
        <span className="grid size-10 place-items-center rounded-xl bg-mint/10 text-mint">
          <Icon size={20} />
        </span>
      </div>
    </Card>
  );
}

function SmallStat({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div className="rounded-lg bg-white/55 p-3 dark:bg-white/[0.06]">
      <p className="text-xs font-bold uppercase text-ink/45 dark:text-white/45">{label}</p>
      <p className={tone === "green" ? "mt-1 text-lg font-black text-mint" : tone === "red" ? "mt-1 text-lg font-black text-coral" : "mt-1 text-lg font-black"}>{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h3 className="mb-4 text-lg font-black">{title}</h3>
      {children}
    </Card>
  );
}

function ReportMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div className="rounded-lg border border-white/55 bg-white/55 p-4 dark:border-white/10 dark:bg-white/[0.06]">
      <p className="text-sm text-ink/55 dark:text-white/55">{label}</p>
      <p className={tone === "green" ? "mt-1 text-xl font-black text-mint" : tone === "red" ? "mt-1 text-xl font-black text-coral" : "mt-1 text-xl font-black"}>{value}</p>
    </div>
  );
}

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="report-section mt-6">
      <h3 className="mb-3 text-lg font-black">{title}</h3>
      {children}
    </section>
  );
}

function ReportTable({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-lg font-bold">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          {children}
        </table>
      </div>
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

function EmptyBox({ text }: { text: string }) {
  return (
    <div className="grid min-h-40 place-items-center rounded-xl bg-ink/[0.03] p-5 text-sm text-ink/55 dark:bg-white/[0.06] dark:text-white/55">
      {text}
    </div>
  );
}
