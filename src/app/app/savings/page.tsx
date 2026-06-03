"use client";

import { PiggyBank, Trash2 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { useFinance, useMonthlyStats } from "@/components/finance-provider";
import { money } from "@/lib/utils";
import type { Currency } from "@/lib/types";

export default function SavingsPage() {
  const {
    currency,
    savings,
    savingsBreakdowns,
    saveMonthlySavings,
    deleteSavingsMonth,
    clearSavingsHistory,
    closeMonth
  } = useFinance();
  const activeCurrency = currency as Currency;
  const stats = useMonthlyStats();
  let running = 0;
  const chartRows = [...savings]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .map((item) => {
      running += Number(item.total_saved);
      return {
        label: `${item.month}/${item.year}`,
        monthlySavings: Number(item.monthly_savings),
        unusedBudget: Number(item.unused_budget),
        leftoverWallet: Number(item.leftover_wallet ?? 0),
        totalSaved: Number(item.total_saved),
        lifetime: running
      };
    });

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold"><PiggyBank className="text-mint" /> Savings Report</h2>
            <p className="mt-1 text-sm text-ink/55 dark:text-white/55">Monthly savings and real leftover wallet money are stored as savings. Budget limits only explain spending targets.</p>
          </div>
          <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void saveMonthlySavings(Number(form.get("monthly_savings") || 0));
              }}
            >
              <Field label="Monthly Savings" name="monthly_savings" type="number" step="0.01" defaultValue={stats.monthlySavings} />
              <Button className="mt-6">Save</Button>
            </form>
            <Button
              type="button"
              variant="danger"
              className="mt-6"
              onClick={() => {
                if (window.confirm("Delete all savings history and breakdowns?")) {
                  void clearSavingsHistory();
                }
              }}
            >
              <Trash2 size={16} />
              Clear All
            </Button>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <GuideTile label="1. Manual Savings" value="The amount you choose to protect first." />
          <GuideTile label="2. Budget Left" value="A category limit you did not fully use. This explains spending, but does not create money." />
          <GuideTile label="3. Leftover Wallet" value="Money still left to spend when the month closes." />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Current Month Breakdown</h2>
          <div className="grid gap-3">
            <SummaryLine label="Monthly Savings" value={money(stats.monthlySavings, activeCurrency)} />
            <SummaryLine label="Leftover Wallet Balance" value={money(stats.leftoverWallet, activeCurrency)} />
            <div className="rounded-md border border-ink/10 p-4 dark:border-white/10">
              <h3 className="mb-3 font-bold">Budget Left Breakdown</h3>
              <div className="grid gap-2">
                {stats.breakdown.map((item) => (
                  <div key={item.category} className="flex justify-between text-sm">
                    <span className="capitalize">{item.category}</span>
                    <span className="font-semibold">{money(item.amount, activeCurrency)}</span>
                  </div>
                ))}
              </div>
            </div>
            <SummaryLine label="Total Budget Left" value={money(stats.unusedBudget, activeCurrency)} />
            <SummaryLine label="Total Saved This Month" value={money(stats.totalSavedThisMonth, activeCurrency)} strong />
            <Button onClick={() => closeMonth(stats.month, stats.year)}>Close Current Month</Button>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold">Lifetime Savings Growth</h2>
          <ResponsiveContainer width="100%" height={320}>
            <AreaChart data={chartRows}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.18)" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip formatter={(value: number) => money(value, activeCurrency)} />
              <Area type="monotone" dataKey="lifetime" stroke="#28a86b" fill="#28a86b33" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-bold">Savings Sources by Month</h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartRows}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,120,120,.18)" />
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip formatter={(value: number) => money(value, activeCurrency)} />
            <Legend />
            <Bar dataKey="monthlySavings" fill="#28a86b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="unusedBudget" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="leftoverWallet" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="totalSaved" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid gap-4">
        {savings.map((item) => {
          const breakdown = savingsBreakdowns.filter((part) => part.month === item.month && part.year === item.year);
          return (
            <Card key={item.id}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold">{item.month}/{item.year}</h2>
                  <p className="text-sm text-ink/55 dark:text-white/55">{item.closed_at ? "Closed month" : "Open month"}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-black text-mint">{money(item.total_saved, activeCurrency)}</p>
                  <Button
                    type="button"
                    variant="danger"
                    className="size-9 px-0"
                    onClick={() => {
                      if (window.confirm(`Delete savings record for ${item.month}/${item.year}?`)) {
                        void deleteSavingsMonth(item.id, item.month, item.year);
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <SummaryLine label="Monthly Savings" value={money(item.monthly_savings, activeCurrency)} />
                <SummaryLine label="Budget Left" value={money(item.unused_budget, activeCurrency)} />
                <SummaryLine label="Leftover Wallet" value={money(item.leftover_wallet ?? 0, activeCurrency)} />
                <SummaryLine label="Total Saved" value={money(item.total_saved, activeCurrency)} strong />
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2 lg:grid-cols-4">
                {breakdown.map((part) => (
                  <div key={part.id} className="rounded-md bg-ink/[0.03] p-3 text-sm dark:bg-white/[0.06]">
                    <p className="capitalize text-ink/55 dark:text-white/55">{part.category}</p>
                    <p className="font-bold">{money(part.amount, activeCurrency)}</p>
                  </div>
                ))}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function SummaryLine({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-md border border-ink/10 p-4 dark:border-white/10">
      <p className="text-sm text-ink/55 dark:text-white/55">{label}</p>
      <p className={strong ? "mt-1 text-xl font-black text-mint" : "mt-1 text-lg font-bold"}>{value}</p>
    </div>
  );
}

function GuideTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-ink/[0.03] p-3 text-sm dark:bg-white/[0.06]">
      <p className="font-bold">{label}</p>
      <p className="mt-1 text-ink/60 dark:text-white/60">{value}</p>
    </div>
  );
}
