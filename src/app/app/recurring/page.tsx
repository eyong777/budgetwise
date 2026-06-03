"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, SelectField } from "@/components/ui/field";
import { useFinance } from "@/components/finance-provider";
import { expenseCategories, frequencies } from "@/lib/constants";
import { money } from "@/lib/utils";
import { recurringSchema } from "@/lib/validations";
import type { Currency, RecurringTransaction } from "@/lib/types";

type Values = z.infer<typeof recurringSchema>;

export default function RecurringPage() {
  const { recurring, wallets, saveRecurring, deleteRecurring, currency } = useFinance();
  const activeCurrency = currency as Currency;
  const [editing, setEditing] = useState<RecurringTransaction | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(recurringSchema),
    defaultValues: { amount: 0, category: "bills", wallet_id: wallets[0]?.id ?? "", description: "", frequency: "monthly", next_run: new Date().toISOString().slice(0, 10) }
  });

  async function submit(values: Values) {
    await saveRecurring({ ...values, id: editing?.id, type: "expense" });
    setEditing(null);
    form.reset({ amount: 0, category: "bills", wallet_id: wallets[0]?.id ?? "", description: "", frequency: "monthly", next_run: new Date().toISOString().slice(0, 10) });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <Card>
        <h2 className="mb-4 text-lg font-bold">{editing ? "Edit recurring expense" : "Schedule recurring expense"}</h2>
        <form onSubmit={form.handleSubmit(submit)} className="grid gap-4">
          <Field label="Amount" type="number" step="0.01" {...form.register("amount")} />
          <SelectField label="Category" {...form.register("category")}>{expenseCategories.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField>
          <SelectField label="Wallet" {...form.register("wallet_id")}>{wallets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>
          <SelectField label="Frequency" {...form.register("frequency")}>{frequencies.map((item) => <option key={item} value={item}>{item}</option>)}</SelectField>
          <Field label="Next run" type="date" {...form.register("next_run")} />
          <Field label="Description" {...form.register("description")} />
          <Button>{editing ? "Save schedule" : "Add schedule"}</Button>
        </form>
      </Card>
      <div className="grid gap-3">
        {recurring.map((item) => (
          <Card key={item.id}>
            <div className="grid gap-3 md:grid-cols-[1fr_140px_100px] md:items-center">
              <div>
                <h2 className="font-bold capitalize">{item.description || item.category}</h2>
                <p className="text-sm text-ink/50 dark:text-white/50">{item.frequency} · next run {item.next_run}</p>
              </div>
              <p className="font-bold text-coral">-{money(item.amount, activeCurrency)}</p>
              <div className="flex gap-2 md:justify-end">
                <Button variant="secondary" className="size-9 px-0" onClick={() => { setEditing(item); form.reset({ amount: item.amount, category: item.category as Values["category"], wallet_id: item.wallet_id ?? "", description: item.description ?? "", frequency: item.frequency, next_run: item.next_run }); }}><Pencil size={16} /></Button>
                <Button variant="danger" className="size-9 px-0" onClick={() => deleteRecurring(item.id)}><Trash2 size={16} /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
