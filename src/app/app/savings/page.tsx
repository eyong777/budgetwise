"use client";

import { PiggyBank, Trash2 } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useFinance, useMonthlyStats } from "@/components/finance-provider";
import { money } from "@/lib/utils";
import type { Currency } from "@/lib/types";

export default function SavingsPage() {
  const {
    currency,
    savings,
    savingsBreakdowns,
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
            <p className="mt-1 text-sm text-ink/55 dark:text-white/55">Savings is made from monthly savings and real wallet money left after expenses. Budget left is only a limit check.</p>
          </div>
          <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                if (window.confirm("Delete all savings test data and breakdowns?")) {
                  void clearSavingsHistory();
                }
              }}
            >
              <Trash2 size={16} />
              Delete All Test Savings
            </Button>
          </div>
        </div>
        {stats.monthlySavings <= 0 && (
          <div className="mt-5 rounded-md bg-mint/10 p-4 text-sm font-semibold text-mint">
            Monthly Savings is required after adding wallet money. The app will ask for it automatically.
          </div>
        )}
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <GuideTile label="1. Manual Savings" value="The amount you choose to protect first." />
          <GuideTile label="2. Leftover Wallet" value="Money still left to spend when the month closes." />
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <h2 className="mb-4 text-lg font-bold">Current Month Breakdown</h2>
          <div className="grid gap-3">
            <SummaryLine label="Mandatory Monthly Savings" value={money(stats.monthlySavings, activeCurrency)} />
            <SummaryLine label="Available Balance" value={money(stats.leftoverWallet, activeCurrency)} />
            <SummaryLine
              label="Total Saved This Month"
              value={money(stats.totalSavedThisMonth, activeCurrency)}
              strong
            />
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
              <div className="grid gap-3 md:grid-cols-3">
                <SummaryLine label="Monthly Savings" value={money(item.monthly_savings, activeCurrency)} />
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
