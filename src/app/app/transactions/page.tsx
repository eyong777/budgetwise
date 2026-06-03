"use client";

import { useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, SelectField, TextAreaField } from "@/components/ui/field";
import { useFinance, useMonthlyStats } from "@/components/finance-provider";
import { expenseCategories } from "@/lib/constants";
import { money } from "@/lib/utils";
import { transactionSchema } from "@/lib/validations";
import type { Currency, Transaction } from "@/lib/types";

type Values = z.infer<typeof transactionSchema>;

export default function TransactionsPage() {
  const { transactions, wallets, saveTransaction, deleteTransaction, currency } = useFinance();
  const stats = useMonthlyStats();
  const activeCurrency = currency as Currency;
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [wallet, setWallet] = useState("");
  const [sort, setSort] = useState("date-desc");
  const form = useForm<Values>({
    resolver: zodResolver(transactionSchema),
    defaultValues: { amount: 0, category: "food", wallet_id: wallets[0]?.id ?? "", description: "", date: new Date().toISOString().slice(0, 10) }
  });

  const filtered = useMemo(() => {
    return transactions
      .filter((item) => [item.category, item.description].join(" ").toLowerCase().includes(query.toLowerCase()))
      .filter((item) => !category || item.category === category)
      .filter((item) => !wallet || item.wallet_id === wallet)
      .sort((a, b) => {
        if (sort === "amount-asc") return Number(a.amount) - Number(b.amount);
        if (sort === "amount-desc") return Number(b.amount) - Number(a.amount);
        if (sort === "date-asc") return +new Date(a.date) - +new Date(b.date);
        return +new Date(b.date) - +new Date(a.date);
      });
  }, [category, query, sort, transactions, wallet]);

  async function submit(values: Values) {
    await saveTransaction({ ...values, id: editing?.id, type: "expense" });
    setEditing(null);
    form.reset({ amount: 0, category: "food", wallet_id: wallets[0]?.id ?? "", description: "", date: new Date().toISOString().slice(0, 10) });
  }

  function edit(item: Transaction) {
    setEditing(item);
    form.reset({ amount: item.amount, category: item.category as Values["category"], wallet_id: item.wallet_id ?? "", description: item.description ?? "", date: item.date });
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="text-sm text-ink/55 dark:text-white/55">Ready to Assign</p>
            <p className={stats.readyToAssign < 0 ? "mt-1 text-2xl font-black text-coral" : "mt-1 text-2xl font-black text-mint"}>{money(stats.readyToAssign, activeCurrency)}</p>
          </div>
          <div>
            <p className="text-sm text-ink/55 dark:text-white/55">Expenses This Month</p>
            <p className="mt-1 text-2xl font-black text-coral">{money(stats.monthlyExpenses, activeCurrency)}</p>
          </div>
          <div>
            <p className="text-sm text-ink/55 dark:text-white/55">Available in Categories</p>
            <p className="mt-1 text-2xl font-black">{money(stats.categoryAvailable, activeCurrency)}</p>
          </div>
        </div>
        <p className="mt-4 rounded-md bg-ink/[0.03] p-3 text-sm text-ink/60 dark:bg-white/[0.06] dark:text-white/60">
          Adding an expense creates category activity. The category available amount goes down, but monthly savings stays protected.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><Plus size={20} /> {editing ? "Edit expense" : "Add expense"}</h2>
        <form onSubmit={form.handleSubmit(submit)} className="grid gap-4">
          <Field label="Amount" type="number" step="0.01" {...form.register("amount")} />
          <SelectField label="Category" {...form.register("category")}>
            {expenseCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </SelectField>
          <SelectField label="Wallet" {...form.register("wallet_id")}>
            {wallets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </SelectField>
          <Field label="Date" type="date" {...form.register("date")} />
          <TextAreaField label="Description" {...form.register("description")} />
          <Button disabled={form.formState.isSubmitting}>{editing ? "Save changes" : "Add expense"}</Button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_150px_150px_150px]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 text-ink/40 dark:text-white/40" size={18} />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search expenses" className="h-10 w-full rounded-md border border-ink/10 bg-white pl-10 pr-3 text-sm outline-none focus:border-mint dark:border-white/10 dark:bg-white/10" />
          </label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 rounded-md border border-ink/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/10">
            <option value="">All categories</option>
            {expenseCategories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select value={wallet} onChange={(e) => setWallet(e.target.value)} className="h-10 rounded-md border border-ink/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/10">
            <option value="">All wallets</option>
            {wallets.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 rounded-md border border-ink/10 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/10">
            <option value="date-desc">Newest</option>
            <option value="date-asc">Oldest</option>
            <option value="amount-desc">Amount high</option>
            <option value="amount-asc">Amount low</option>
          </select>
        </div>
        <div className="grid gap-2">
          {filtered.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-md border border-ink/10 p-3 dark:border-white/10 md:grid-cols-[1fr_130px_96px] md:items-center">
              <div>
                <p className="font-semibold capitalize">{item.category}</p>
                <p className="text-sm text-ink/50 dark:text-white/50">{item.description || "No description"} · {item.date}</p>
              </div>
              <p className="font-bold text-coral">-{money(item.amount, activeCurrency)}</p>
              <div className="flex gap-2 md:justify-end">
                <Button variant="secondary" className="size-9 px-0" onClick={() => edit(item)}><Pencil size={16} /></Button>
                <Button variant="danger" className="size-9 px-0" onClick={() => deleteTransaction(item.id)}><Trash2 size={16} /></Button>
              </div>
            </div>
          ))}
        </div>
      </Card>
      </div>
    </div>
  );
}
