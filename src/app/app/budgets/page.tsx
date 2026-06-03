"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
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

export default function BudgetsPage() {
  const { budgets, transactions, saveBudget, deleteBudget, currency } = useFinance();
  const activeCurrency = currency as Currency;
  const [editing, setEditing] = useState<Budget | null>(null);
  const now = monthKey();
  const currentBudgets = Array.from(
    new Map(
      budgets
        .sort((a, b) => b.year - a.year || b.month - a.month)
        .map((budget) => [budget.category, budget])
    ).values()
  );
  const form = useForm<Values>({ resolver: zodResolver(budgetSchema), defaultValues: { category: "food", limit_amount: 0, month: now.month, year: now.year } });

  async function submit(values: Values) {
    await saveBudget({ ...values, id: editing?.id });
    setEditing(null);
    form.reset({ category: "food", limit_amount: 0, month: now.month, year: now.year });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <Card>
        <h2 className="mb-4 text-lg font-bold">{editing ? "Edit budget" : "Create monthly budget"}</h2>
        <form onSubmit={form.handleSubmit(submit)} className="grid gap-4">
          <SelectField label="Category" {...form.register("category")}>
            {expenseCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          <Field label="Limit amount" type="number" step="0.01" {...form.register("limit_amount")} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Month" type="number" {...form.register("month")} />
            <Field label="Year" type="number" {...form.register("year")} />
          </div>
          <Button>{editing ? "Save budget" : "Add budget"}</Button>
        </form>
      </Card>

      <div className="grid gap-4">
        {currentBudgets.map((budget) => {
          const spent = transactions
            .filter((item) => item.type === "expense" && item.category === budget.category)
            .filter((item) => {
              const date = new Date(item.date);
              return date.getMonth() + 1 === budget.month && date.getFullYear() === budget.year;
            })
            .reduce((sum, item) => sum + Number(item.amount), 0);
          const usage = (spent / Number(budget.limit_amount)) * 100;
          const over = usage > 100;

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
                        limit_amount: Number(budget.limit_amount),
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
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className={over ? "font-bold text-coral" : "text-ink/60 dark:text-white/60"}>{money(spent, activeCurrency)} used</span>
                <span>{money(budget.limit_amount, activeCurrency)} limit</span>
              </div>
              <Progress value={usage} alert={over} />
              {over && <p className="mt-3 rounded-md bg-coral/10 p-3 text-sm font-semibold text-coral">Overspending alert: this category is over budget.</p>}
            </Card>
          );
        })}
        {currentBudgets.length === 0 && (
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
