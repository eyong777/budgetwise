"use client";

import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SelectField } from "@/components/ui/field";
import { useFinance, useMonthlyStats } from "@/components/finance-provider";
import { expenseCategories } from "@/lib/constants";
import { money } from "@/lib/utils";
import type { Currency } from "@/lib/types";

const colors = ["#28a86b", "#e25555", "#3b82f6", "#f59e0b", "#8b5cf6", "#14b8a6", "#ef4444", "#64748b", "#84cc16"];

export default function ReportsPage() {
  const { transactions, budgets, savings, wallets, currency } = useFinance();
  const activeCurrency = currency as Currency;
  const stats = useMonthlyStats();
  const [view, setView] = useState("monthly");
  const currentYear = new Date().getFullYear();
  const reportMonthName = new Date(stats.year, stats.month - 1, 1).toLocaleString(undefined, { month: "long", year: "numeric" });

  const monthly = useMemo(() => {
    const rows = Array.from({ length: 12 }, (_, index) => ({
      label: new Date(currentYear, index, 1).toLocaleString(undefined, { month: "short" }),
      expenses: 0,
      budgeted: 0,
      saved: 0
    }));
    transactions.forEach((item) => {
      const date = new Date(item.date);
      if (date.getFullYear() !== currentYear) return;
      rows[date.getMonth()].expenses += Number(item.amount);
    });
    budgets.forEach((item) => {
      if (item.year === currentYear) rows[item.month - 1].budgeted += Number(item.limit_amount);
    });
    savings.forEach((item) => {
      if (item.year === currentYear) rows[item.month - 1].saved += Number(item.total_saved);
    });
    return rows;
  }, [budgets, currentYear, savings, transactions]);

  const breakdown = expenseCategories.map((category) => ({
    name: category,
    value: transactions.filter((item) => item.category === category).reduce((sum, item) => sum + Number(item.amount), 0)
  })).filter((item) => item.value > 0);

  const totals = monthly.reduce((acc, row) => ({
    expenses: acc.expenses + row.expenses,
    budgeted: acc.budgeted + row.budgeted,
    saved: acc.saved + row.saved
  }), { expenses: 0, budgeted: 0, saved: 0 });

  const currentMonthTransactions = transactions.filter((item) => {
    const date = new Date(item.date);
    return date.getMonth() + 1 === stats.month && date.getFullYear() === stats.year;
  });

  const expenseRows = expenseCategories
    .map((category) => ({
      category,
      amount: currentMonthTransactions
        .filter((item) => item.category === category)
        .reduce((sum, item) => sum + Number(item.amount), 0)
    }))
    .filter((item) => item.amount > 0);

  const currentBudgetRows = Array.from(
    new Map(
      [...budgets]
        .sort((a, b) => {
          const aCurrent = a.month === stats.month && a.year === stats.year ? 0 : 1;
          const bCurrent = b.month === stats.month && b.year === stats.year ? 0 : 1;
          return aCurrent - bCurrent || b.year - a.year || b.month - a.month;
        })
        .map((budget) => [budget.category, budget])
    ).values()
  ).map((budget) => {
    const spent = currentMonthTransactions
      .filter((item) => item.category === budget.category)
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return {
      category: budget.category,
      budgeted: Number(budget.limit_amount),
      spent,
      left: Math.max(0, Number(budget.limit_amount) - spent),
      over: Math.max(0, spent - Number(budget.limit_amount))
    };
  });

  return (
    <div className="grid gap-6">
      <Card className="no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Reports & Analytics</h2>
            <p className="text-sm text-ink/55 dark:text-white/55">{view === "monthly" ? "Monthly report view" : "Yearly report view"} for {currentYear}</p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <SelectField label="Report view" value={view} onChange={(event) => setView(event.target.value)} className="w-48">
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </SelectField>
            <Button type="button" onClick={() => window.print()}>
              <Printer size={16} />
              Print Report
            </Button>
          </div>
        </div>
      </Card>

      <div className="no-print grid gap-6 xl:grid-cols-2">
        <ChartCard title="Budget vs Expenses">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.18)" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => money(value, activeCurrency)} />
              <Legend />
              <Bar dataKey="budgeted" fill="#28a86b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#e25555" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Expense Breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={breakdown} dataKey="value" nameKey="name" outerRadius={105} label>
                {breakdown.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
              </Pie>
              <Tooltip formatter={(value: number) => money(value, activeCurrency)} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Monthly Spending Trend">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.18)" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => money(value, activeCurrency)} />
              <Area type="monotone" dataKey="expenses" stroke="#e25555" fill="#e2555530" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Savings Growth">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthly.map((row, index) => ({ ...row, lifetime: monthly.slice(0, index + 1).reduce((sum, item) => sum + item.saved, 0) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.18)" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => money(value, activeCurrency)} />
              <Area type="monotone" dataKey="lifetime" stroke="#28a86b" fill="#28a86b33" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="no-print grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-ink/55 dark:text-white/55">Total budgeted</p><p className="mt-2 text-2xl font-black text-mint">{money(totals.budgeted, activeCurrency)}</p></Card>
        <Card><p className="text-sm text-ink/55 dark:text-white/55">Total expenses</p><p className="mt-2 text-2xl font-black text-coral">{money(totals.expenses, activeCurrency)}</p></Card>
        <Card><p className="text-sm text-ink/55 dark:text-white/55">Total saved</p><p className="mt-2 text-2xl font-black">{money(totals.saved, activeCurrency)}</p></Card>
      </div>

      <Card className="print-report">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">BudgetWise Printable Report</h2>
            <p className="mt-1 text-sm text-ink/55 dark:text-white/55">Current month report for {reportMonthName}</p>
          </div>
          <p className="text-sm text-ink/55 dark:text-white/55">Generated {new Date().toLocaleDateString()}</p>
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <ReportMetric label="Wallet Money" value={money(stats.walletAmount, activeCurrency)} />
          <ReportMetric label="Wallet Left" value={money(stats.walletBalance, activeCurrency)} />
          <ReportMetric label="Expenses This Month" value={money(stats.monthlyExpenses, activeCurrency)} tone="red" />
          <ReportMetric label="Saved This Month" value={money(stats.totalSavedThisMonth, activeCurrency)} tone="green" />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <ReportTable title="Wallets">
            <thead>
              <tr><th>Name</th><th>Type</th><th className="text-right">Balance</th></tr>
            </thead>
            <tbody>
              {wallets.map((wallet) => (
                <tr key={wallet.id}>
                  <td>{wallet.name}</td>
                  <td className="capitalize">{wallet.type}</td>
                  <td className="text-right">{money(wallet.balance, activeCurrency)}</td>
                </tr>
              ))}
              {wallets.length === 0 && <EmptyTableRow colSpan={3} text="No wallets added." />}
            </tbody>
          </ReportTable>

          <ReportTable title="Expenses by Category">
            <thead>
              <tr><th>Category</th><th className="text-right">Amount</th></tr>
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

        <div className="mt-6">
          <ReportTable title="Budget Health">
            <thead>
              <tr>
                <th>Category</th>
                <th className="text-right">Budget Limit</th>
                <th className="text-right">Spent</th>
                <th className="text-right">Left</th>
                <th className="text-right">Over</th>
              </tr>
            </thead>
            <tbody>
              {currentBudgetRows.map((row) => (
                <tr key={row.category}>
                  <td className="capitalize">{row.category}</td>
                  <td className="text-right">{money(row.budgeted, activeCurrency)}</td>
                  <td className="text-right">{money(row.spent, activeCurrency)}</td>
                  <td className="text-right">{money(row.left, activeCurrency)}</td>
                  <td className="text-right">{money(row.over, activeCurrency)}</td>
                </tr>
              ))}
              {currentBudgetRows.length === 0 && <EmptyTableRow colSpan={5} text="No budgets added." />}
            </tbody>
          </ReportTable>
        </div>

        <div className="mt-6">
          <ReportTable title="Expense Details">
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
              {currentMonthTransactions.length === 0 && <EmptyTableRow colSpan={4} text="No expense details this month." />}
            </tbody>
          </ReportTable>
        </div>
      </Card>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {children}
    </Card>
  );
}

function ReportMetric({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div className="rounded-md border border-white/50 bg-white/45 p-4 dark:border-white/10 dark:bg-white/[0.06]">
      <p className="text-sm text-ink/55 dark:text-white/55">{label}</p>
      <p className={tone === "green" ? "mt-1 text-xl font-black text-mint" : tone === "red" ? "mt-1 text-xl font-black text-coral" : "mt-1 text-xl font-black"}>{value}</p>
    </div>
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
