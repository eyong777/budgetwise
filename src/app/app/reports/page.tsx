"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { SelectField } from "@/components/ui/field";
import { useFinance } from "@/components/finance-provider";
import { expenseCategories } from "@/lib/constants";
import { money } from "@/lib/utils";
import type { Currency } from "@/lib/types";

const colors = ["#28a86b", "#e25555", "#3b82f6", "#f59e0b", "#8b5cf6", "#14b8a6", "#ef4444", "#64748b", "#84cc16"];

export default function ReportsPage() {
  const { transactions, budgets, savings, currency } = useFinance();
  const activeCurrency = currency as Currency;
  const [view, setView] = useState("monthly");
  const currentYear = new Date().getFullYear();

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

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">Reports & Analytics</h2>
            <p className="text-sm text-ink/55 dark:text-white/55">{view === "monthly" ? "Monthly report view" : "Yearly report view"} for {currentYear}</p>
          </div>
          <SelectField label="Report view" value={view} onChange={(event) => setView(event.target.value)} className="w-48">
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </SelectField>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Assigned vs Activity">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.18)" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => money(value, activeCurrency)} />
              <Legend />
              <Bar dataKey="budgeted" name="Assigned" fill="#28a86b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Activity" fill="#e25555" radius={[4, 4, 0, 0]} />
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card><p className="text-sm text-ink/55 dark:text-white/55">Total assigned</p><p className="mt-2 text-2xl font-black text-mint">{money(totals.budgeted, activeCurrency)}</p></Card>
        <Card><p className="text-sm text-ink/55 dark:text-white/55">Total activity</p><p className="mt-2 text-2xl font-black text-coral">{money(totals.expenses, activeCurrency)}</p></Card>
        <Card><p className="text-sm text-ink/55 dark:text-white/55">Total saved</p><p className="mt-2 text-2xl font-black">{money(totals.saved, activeCurrency)}</p></Card>
      </div>
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
