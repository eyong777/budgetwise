"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, SelectField } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { useFinance } from "@/components/finance-provider";
import { expenseCategories } from "@/lib/constants";
import { monthKey, money } from "@/lib/utils";
import { budgetSchema } from "@/lib/validations";
import type { Budget, Currency } from "@/lib/types";

type Values = z.infer<typeof budgetSchema>;

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

export default function BudgetsPage() {
  const { budgets, transactions, saveBudget, deleteBudget, currency } = useFinance();
  const activeCurrency = currency as Currency;
  const [editing, setEditing] = useState<Budget | null>(null);
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const now = monthKey();
  const currentBudgets = getSyncedBudgets(budgets, now.month, now.year);
  const budgetRows = currentBudgets.map((budget) => {
    const spent = transactions
      .filter((item) => item.type === "expense" && item.category === budget.category)
      .filter((item) => {
        const date = new Date(item.date);
        return date.getMonth() + 1 === budget.month && date.getFullYear() === budget.year;
      })
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const limit = Number(budget.limit_amount);
    const usage = limit > 0 ? (spent / limit) * 100 : 0;
    const left = Math.max(0, limit - spent);
    const over = usage > 100;

    return { ...budget, spent, limit, left, usage, over };
  });
  const totalLimit = budgetRows.reduce((sum, budget) => sum + budget.limit, 0);
  const totalSpent = budgetRows.reduce((sum, budget) => sum + budget.spent, 0);
  const totalLeft = budgetRows.reduce((sum, budget) => sum + budget.left, 0);
  const form = useForm<Values>({ resolver: zodResolver(budgetSchema), defaultValues: { category: "food", limit_amount: 0, month: now.month, year: now.year } });

  async function submit(values: Values) {
    await saveBudget({ ...values, id: editing?.id });
    setEditing(null);
    form.reset({ category: "food", limit_amount: 0, month: now.month, year: now.year });
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
      <div ref={formCardRef} className="xl:sticky xl:top-24 xl:self-start">
        <Card className="p-4">
          <h2 className="mb-4 text-lg font-bold">{editing ? "Edit budget" : "Create monthly budget"}</h2>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-3">
            <SelectField label="Category" {...form.register("category")}>
              {expenseCategories.map((item) => <option key={item} value={item}>{item}</option>)}
            </SelectField>
            <Field label="Limit amount" type="number" step="0.01" {...form.register("limit_amount")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Month" type="number" className="min-w-0 w-full" {...form.register("month")} />
              <Field label="Year" type="number" className="min-w-0 w-full" {...form.register("year")} />
            </div>
            <Button>{editing ? "Save budget" : "Add budget"}</Button>
          </form>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <BudgetTotal label="Monthly Budget" value={money(totalLimit, activeCurrency)} />
            <BudgetTotal label="Spent" value={money(totalSpent, activeCurrency)} tone="red" />
            <BudgetTotal label="Left" value={money(totalLeft, activeCurrency)} tone="green" />
          </div>
        </Card>

        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
        {budgetRows.map((budget) => {
          return (
            <Card key={budget.id} className="p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs text-ink/50 dark:text-white/50">{budget.month}/{budget.year}</p>
                  <h2 className="text-lg font-bold capitalize">{budget.category}</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    className="size-8 px-0"
                    onClick={() => {
                      setEditing(budget);
                      form.reset({
                        category: budget.category as Values["category"],
                        limit_amount: Number(budget.limit_amount),
                        month: Number(budget.month),
                        year: Number(budget.year)
                      });
                      window.setTimeout(() => {
                        formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                        const amountInput = document.querySelector<HTMLInputElement>("input[name='limit_amount']");
                        amountInput?.focus();
                        amountInput?.select();
                      }, 0);
                    }}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button variant="danger" className="size-8 px-0" onClick={() => deleteBudget(budget.id)}><Trash2 size={16} /></Button>
                </div>
              </div>
              <div className="mb-2 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-ink/45 dark:text-white/45">Limit</p>
                  <p className="font-black">{money(budget.limit, activeCurrency)}</p>
                </div>
                <div>
                  <p className="text-ink/45 dark:text-white/45">Used</p>
                  <p className={budget.over ? "font-black text-coral" : "font-black"}>{money(budget.spent, activeCurrency)}</p>
                </div>
                <div>
                  <p className="text-ink/45 dark:text-white/45">Left</p>
                  <p className="font-black text-mint">{money(budget.left, activeCurrency)}</p>
                </div>
              </div>
              <Progress value={budget.usage} alert={budget.over} />
              {budget.over && <p className="mt-2 rounded-md bg-coral/10 px-3 py-2 text-xs font-semibold text-coral">Over budget</p>}
            </Card>
          );
        })}
        </div>
        {budgetRows.length === 0 && (
          <Card>
            <p className="text-sm text-ink/60 dark:text-white/60">
              No budgets yet.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

function BudgetTotal({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "green" | "red" }) {
  return (
    <div className="rounded-md bg-ink/[0.03] p-3 dark:bg-white/[0.06]">
      <p className="text-xs font-semibold uppercase text-ink/45 dark:text-white/45">{label}</p>
      <p className={tone === "green" ? "mt-1 text-lg font-black text-mint" : tone === "red" ? "mt-1 text-lg font-black text-coral" : "mt-1 text-lg font-black"}>{value}</p>
    </div>
  );
}
