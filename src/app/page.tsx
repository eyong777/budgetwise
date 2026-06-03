import Link from "next/link";
import { ArrowRight, BarChart3, Bell, CreditCard, PiggyBank, WalletCards } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  { icon: WalletCards, title: "Wallets", copy: "Cash, bank, savings, and credit accounts in one view." },
  { icon: CreditCard, title: "Budgets", copy: "Monthly category limits with overspending alerts." },
  { icon: PiggyBank, title: "Savings", copy: "Reserve monthly savings and track real leftover wallet money." },
  { icon: BarChart3, title: "Reports", copy: "Expenses, budgets, trends, and savings analytics." },
  { icon: Bell, title: "Recurring", copy: "Schedule rent, bills, and subscriptions." }
];

export default function LandingPage() {
  return (
    <main className="bg-paper text-ink dark:bg-[#101412] dark:text-white">
      <section className="relative min-h-[86vh] overflow-hidden border-b border-ink/10 dark:border-white/10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(247,248,244,0.90),rgba(247,248,244,0.62)_42%,rgba(16,20,18,0.26)),url('/budgetwise-hero.jpg')] bg-cover bg-center" />
        <div className="absolute inset-0 bg-paper/20 dark:bg-[#101412]/45" />
        <div className="relative mx-auto flex min-h-[86vh] max-w-7xl flex-col px-4 py-6 sm:px-6">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-mint text-white">
                <PiggyBank />
              </span>
              <span className="text-xl font-bold">BudgetWise</span>
            </div>
            <div className="flex gap-2">
              <Link href="/login">
                <Button variant="secondary">Log in</Button>
              </Link>
              <Link href="/register">
                <Button>Start free</Button>
              </Link>
            </div>
          </header>
          <div className="grid flex-1 items-center py-12">
            <div className="max-w-3xl">
              <h1 className="text-5xl font-black leading-[1.02] sm:text-7xl">BudgetWise</h1>
              <p className="mt-5 max-w-2xl text-xl leading-8 text-ink/70 dark:text-white/70">
                A modern budgeting SaaS for tracking expenses, wallets, budgets, protected savings, recurring payments, and analytics without spreadsheet fatigue.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/register">
                  <Button className="h-12 px-5">Create account <ArrowRight size={18} /></Button>
                </Link>
                <Link href="/login">
                  <Button className="h-12 px-5" variant="secondary">View dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
          <div className="grid gap-3 pb-6 sm:grid-cols-2 lg:grid-cols-5">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-lg border border-ink/10 bg-white/80 p-4 backdrop-blur dark:border-white/10 dark:bg-white/10">
                  <Icon className="mb-3 text-mint" size={22} />
                  <h2 className="font-bold">{feature.title}</h2>
                  <p className="mt-1 text-sm text-ink/60 dark:text-white/60">{feature.copy}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
