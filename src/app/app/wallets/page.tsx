"use client";

import { useState } from "react";
import { ArrowRightLeft, Pencil, Trash2, WalletCards } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, SelectField } from "@/components/ui/field";
import { useFinance, useMonthlyStats } from "@/components/finance-provider";
import { walletTypes } from "@/lib/constants";
import { money } from "@/lib/utils";
import { walletSchema } from "@/lib/validations";
import type { Currency, Wallet } from "@/lib/types";

type Values = z.infer<typeof walletSchema>;

export default function WalletsPage() {
  const { wallets, saveWallet, deleteWallet, transfer, currency } = useFinance();
  const stats = useMonthlyStats();
  const activeCurrency = currency as Currency;
  const [editing, setEditing] = useState<Wallet | null>(null);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [amount, setAmount] = useState(0);
  const form = useForm<Values>({ resolver: zodResolver(walletSchema), defaultValues: { name: "", type: "bank", balance: 0 } });

  async function submit(values: Values) {
    await saveWallet({ ...values, id: editing?.id });
    setEditing(null);
    form.reset({ name: "", type: "bank", balance: 0 });
  }

  return (
    <div className="grid gap-6">
      <Card>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm text-ink/55 dark:text-white/55">Monthly Savings + Expenses</p>
            <p className="mt-1 text-2xl font-black text-coral">{money(stats.monthlySavings + stats.monthlyExpenses, activeCurrency)}</p>
          </div>
          <div>
            <p className="text-sm text-ink/55 dark:text-white/55">Money Left to Spend</p>
            <p className="mt-1 text-2xl font-black text-mint">{money(stats.walletBalance, activeCurrency)}</p>
          </div>
        </div>
        <p className="mt-4 rounded-md bg-ink/[0.03] p-3 text-sm text-ink/60 dark:bg-white/[0.06] dark:text-white/60">
          Wallet cards show each account balance. Monthly savings and expenses are separated so you can clearly see money left to spend.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
      <div className="grid gap-6">
        <Card>
          <h2 className="flex items-center gap-2 text-lg font-bold"><WalletCards size={20} /> {editing ? "Edit wallet" : "Add wallet money"}</h2>
          <p className="mb-4 mt-1 text-sm text-ink/55 dark:text-white/55">After adding wallet money, set Monthly Savings before continuing.</p>
          <form onSubmit={form.handleSubmit(submit)} className="grid gap-4">
            <Field label="Wallet name" {...form.register("name")} />
            <SelectField label="Type" {...form.register("type")}>
              {walletTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </SelectField>
            <Field label="Wallet amount" type="number" step="0.01" {...form.register("balance")} />
            <Button disabled={form.formState.isSubmitting}>{editing ? "Save wallet" : "Add wallet"}</Button>
          </form>
        </Card>
        <Card>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-bold"><ArrowRightLeft size={20} /> Transfer money</h2>
          <div className="grid gap-4">
            <SelectField label="From" value={fromId} onChange={(e) => setFromId(e.target.value)}>
              <option value="">Choose wallet</option>
              {wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
            </SelectField>
            <SelectField label="To" value={toId} onChange={(e) => setToId(e.target.value)}>
              <option value="">Choose wallet</option>
              {wallets.map((wallet) => <option key={wallet.id} value={wallet.id}>{wallet.name}</option>)}
            </SelectField>
            <Field label="Amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
            <Button onClick={() => transfer(fromId, toId, amount)}>Transfer</Button>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {wallets.map((wallet) => (
          <Card key={wallet.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm capitalize text-ink/55 dark:text-white/55">{wallet.type}</p>
                <h2 className="mt-1 text-xl font-bold">{wallet.name}</h2>
                <p className="mt-5 text-3xl font-black">{money(wallet.balance, activeCurrency)}</p>
                <p className="mt-2 text-sm text-ink/50 dark:text-white/50">Money added here before monthly savings and expenses are subtracted.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" className="size-9 px-0" onClick={() => { setEditing(wallet); form.reset(wallet); }}><Pencil size={16} /></Button>
                <Button variant="danger" className="size-9 px-0" onClick={() => deleteWallet(wallet.id)}><Trash2 size={16} /></Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      </div>
    </div>
  );
}
