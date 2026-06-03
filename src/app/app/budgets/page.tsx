"use client";

import { ArrowRightLeft, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, SelectField } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { useFinance, useMonthlyStats } from "@/components/finance-provider";
import { expenseCategories } from "@/lib/constants";
import { monthKey, money } from "@/lib/utils";
import { budgetSchema } from "@/lib/validations";
import type { Budget, Currency } from "@/lib/types";

type Values = z.infer<typeof budgetSchema>;

export default function BudgetsPage() {
  const { budgets, transactions, saveBudget, deleteBudget, currency } = useFinance();
  const stats = useMonthlyStats();
  const activeCurrency = currency as Currency;
  const [editing, setEditing] = useState<Budget | null>(null);
  const [fromCategory, setFromCategory] = useState("food");
  const [toCategory, setToCategory] = useState("transport");
  const [moveAmount, setMoveAmount] = useState(0);
  const now = monthKey();
  const form = useForm<Values>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { category: "food", limit_amount: 0, month: now.month, year: now.year }
  });
  const currentBudgets = budgets.filter((budget) => budget.month === now.month && budget.year === now.year);

  async function submit(values: Values) {
    await saveBudget({ ...values, id: editing?.id });
    setEditing(null);
    form.reset({ category: "food", limit_amount: 0, month: now.month, year: now.year });
  }

  async function moveMoney() {
    const from = currentBudgets.find((budget) => budget.category === fromCategory);
    const to = currentBudgets.find((budget) => budget.category === toCategory);
    if (!from || !to || from.id === to.id || moveAmount <= 0) return;
    await saveBudget({ ...from, limit_amount: Math.max(0, Number(from.limit_amount) - moveAmount) });
    await saveBudget({ ...to, limit_amount: Number(to.limit_amount) + moveAmount });
    setMoveAmount(0);
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Summary label="Ready to Assign" value={money(stats.readyToAssign, activeCurrency)} tone={stats.readyToAssign < 0 ? "red" : "green"} />
          <Summary label="Assigned" value={money(stats.assignedTotal, activeCurrency)} />
          <Summary label="Activity" value={`-${money(stats.categoryActivity, activeCurrency)}`} tone="red" />
          <Summary label="Available in Categories" value={money(stats.categoryAvailable, activeCurrency)} tone="green" />
        </div>
        <p className="mt-4 rounded-md bg-ink/[0.03] p-3 text-sm text-ink/60 dark:bg-white/[0.06] dark:text-white/60">
          Assign only money you already have. Each category is an envelope: assigned money minus spending equals available money.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="grid gap-6">
          <Card>
            <h2 className="mb-4 text-lg font-bold">{editing ? "Edit Assigned Money" : "Assign Money"}</h2>
            <form onSubmit={form.handleSubmit(submit)} className="grid gap-4">
              <SelectField label="Category" {...form.register("category")}>
                {expenseCategories.map((item) => <option key={item} value={item}>{item}</option>)}
              </SelectField>
              <Field label="Assigned amount" type="number" step="0.01" {...form.register("limit_amount")} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Month" type="number" {...form.register("month")} />
                <Field label="Year" type="number" {...form.register("year")} />
              </div>
              <Button>{editing ? "Save Assignment" : "Assign Money"}</Button>
            </form>
          </Card>

          <Card>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ArrowRightLeft size={20} /> Move Money</h2>
            <div className="grid gap-4">
              <SelectField label="From category" value={fromCategory} onChange={(event) => setFromCategory(event.target.value)}>
                {currentBudgets.map((budget) => <option key={budget.id} value={budget.category}>{budget.category}</option>)}
              </SelectField>
              <SelectField label="To category" value={toCategory} onChange={(event) => setToCategory(event.target.value)}>
                {currentBudgets.map((budget) => <option key={budget.id} value={budget.category}>{budget.category}</option>)}
              </SelectField>
              <Field label="Amount" type="number" step="0.01" value={moveAmount} onChange={(event) => setMoveAmount(Number(event.target.value))} />
              <Button onClick={moveMoney}>Move</Button>
            </div>
          </Card>
        </div>

        <div className="grid gap-4">
          {currentBudgets.map((budget) => {
            const activity = transactions
              .filter((item) => item.category === budget.category)
              .filter((item) => {
                const date = new Date(item.date);
                return date.getMonth() + 1 === budget.month && date.getFullYear() === budget.year;
              })
              .reduce((sum, item) => sum + Number(item.amount), 0);
            const assigned = Number(budget.limit_amount);
            const available = assigned - activity;
            const usage = assigned > 0 ? (activity / assigned) * 100 : 0;

            return (
              <Card key={budget.id}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink/50 dark:text-white/50">{budget.month}/{budget.year}</p>
                    <h2 className="text-xl font-bold capitalize">{budget.category}</h2>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      className="size-9 px-0"
                      onClick={() => {
                        setEditing(budget);
                        form.reset({
                          category: budget.category as Values["category"],
                          limit_amount: assigned,
                          month: Number(budget.month),
                          year: Number(budget.year)
                        });
                      }}
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button variant="danger" className="size-9 px-0" onClick={() => deleteBudget(budget.id)}><Trash2 size={16} /></Button>
                  </div>
                </div>
                <div className="mb-3 grid gap-3 sm:grid-cols-3">
                  <EnvelopeNumber label="Assigned" value={money(assigned, activeCurrency)} />
                  <EnvelopeNumber label="Activity" value={`-${money(activity, activeCurrency)}`} tone="red" />
                  <EnvelopeNumber label="Available" value={money(available, activeCurrency)} tone={available < 0 ? "red" : "green"} />
                </div>
                <Progress value={usage} alert={available < 0} />
                {available < 0 && <p className="mt-3 rounded-md bg-coral/10 p-3 text-sm font-semibold text-coral">This category is overspent. Move money from another category to cover it.</p>}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div>
      <p className="text-sm text-ink/55 dark:text-white/55">{label}</p>
      <p className={tone === "green" ? "mt-1 text-2xl font-black text-mint" : tone === "red" ? "mt-1 text-2xl font-black text-coral" : "mt-1 text-2xl font-black"}>{value}</p>
    </div>
  );
}

function EnvelopeNumber({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div className="rounded-md bg-ink/[0.03] p-3 text-sm dark:bg-white/[0.06]">
      <p className="text-ink/55 dark:text-white/55">{label}</p>
      <p className={tone === "green" ? "mt-1 font-black text-mint" : tone === "red" ? "mt-1 font-black text-coral" : "mt-1 font-black"}>{value}</p>
    </div>
  );
}
