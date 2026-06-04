"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  CreditCard,
  LayoutDashboard,
  LogOut,
  Moon,
  PiggyBank,
  ReceiptText,
  Settings,
  Sun,
  WalletCards
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn } from "@/lib/utils";
import { FinanceProvider, useFinance, useMonthlyStats } from "./finance-provider";
import { Button } from "./ui/button";

const links = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/transactions", label: "Transactions", icon: ReceiptText },
  { href: "/app/wallets", label: "Wallets", icon: WalletCards },
  { href: "/app/budgets", label: "Budgets", icon: CreditCard },
  { href: "/app/savings", label: "Savings", icon: PiggyBank },
  { href: "/app/reports", label: "Reports", icon: BarChart3 },
  { href: "/app/recurring", label: "Recurring", icon: Bell },
  { href: "/app/settings", label: "Settings", icon: Settings }
];

const SESSION_TIMEOUT_MS = 10 * 60 * 1000;
const LAST_ACTIVITY_KEY = "budgetwise-last-activity";

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { loading, profile, saveMonthlySavings } = useFinance();
  const stats = useMonthlyStats();
  const [dark, setDark] = useState(false);
  const [requiredSavings, setRequiredSavings] = useState("");
  const [savingRequiredSavings, setSavingRequiredSavings] = useState(false);
  const savingsRequired = stats.walletAmount > 0 && stats.monthlySavings <= 0;

  useEffect(() => {
    const stored = localStorage.getItem("budgetwise-theme");
    const enabled = stored === "dark";
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  function toggleDarkMode() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("budgetwise-theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  }

  async function logout() {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    try {
      await createSupabaseBrowserClient().auth.signOut();
    } catch {
      localStorage.removeItem("budgetwise-theme");
    }
    router.replace("/login");
  }

  useEffect(() => {
    let loggingOut = false;

    async function timeoutLogout() {
      if (loggingOut) return;
      loggingOut = true;
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      try {
        await createSupabaseBrowserClient().auth.signOut();
      } catch {
        // If Supabase is unavailable, still send the user back to login.
      }
      router.replace("/login");
    }

    function markActivity() {
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    }

    function checkTimeout() {
      const lastActivity = Number(localStorage.getItem(LAST_ACTIVITY_KEY) || Date.now());
      if (Date.now() - lastActivity >= SESSION_TIMEOUT_MS) {
        void timeoutLogout();
      }
    }

    checkTimeout();
    markActivity();

    const events = ["click", "keydown", "mousemove", "touchstart", "scroll"];
    events.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));
    const interval = window.setInterval(checkTimeout, 30 * 1000);

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      window.clearInterval(interval);
    };
  }, [router]);

  async function submitRequiredSavings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const amount = Number(requiredSavings);
    if (!amount || amount <= 0) {
      toast.error("Monthly Savings is required before continuing.");
      return;
    }
    setSavingRequiredSavings(true);
    await saveMonthlySavings(amount);
    setSavingRequiredSavings(false);
    setRequiredSavings("");
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-[linear-gradient(135deg,#f7f8f4_0%,#eef7f1_48%,#f7f8f4_100%)] px-4 text-ink dark:bg-[linear-gradient(135deg,#101412_0%,#132018_52%,#101412_100%)] dark:text-white">
        <div className="w-full max-w-sm rounded-lg border border-white/55 bg-white/60 p-6 text-center shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08]">
          <span className="mx-auto grid size-12 place-items-center rounded-lg bg-mint text-white">
            <PiggyBank />
          </span>
          <h1 className="mt-4 text-xl font-bold">Loading BudgetWise</h1>
          <div className="mt-5 h-2 overflow-hidden rounded-full bg-ink/10 dark:bg-white/10">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-mint" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f7f8f4_0%,#eef7f1_48%,#f7f8f4_100%)] text-ink dark:bg-[linear-gradient(135deg,#101412_0%,#132018_52%,#101412_100%)] dark:text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/45 bg-white/55 p-4 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[#121816]/70 lg:block">
        <Link href="/app/dashboard" className="mb-8 flex items-center gap-3 px-2 pt-2">
          <span className="grid size-11 place-items-center rounded-lg bg-mint text-white">
            <PiggyBank />
          </span>
          <span>
            <span className="block text-lg font-bold">BudgetWise</span>
            <span className="text-xs text-ink/50 dark:text-white/50">Personal finance OS</span>
          </span>
        </Link>
        <nav className="grid gap-1">
          {links.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold text-ink/65 transition hover:bg-ink/5 dark:text-white/65 dark:hover:bg-white/10",
                  active && "bg-mint/10 text-mint dark:text-mint"
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="lg:pl-72">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-white/45 bg-white/45 px-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-[#101412]/60 sm:px-6">
          <div>
            <p className="text-sm text-ink/50 dark:text-white/50">Welcome back</p>
            <h1 className="text-xl font-bold">{profile?.full_name || "BudgetWise user"}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" className="size-10 px-0" onClick={toggleDarkMode} title="Toggle dark mode">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
            <Button variant="ghost" className="size-10 px-0" onClick={logout} title="Log out">
              <LogOut size={18} />
            </Button>
          </div>
        </header>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/45 bg-white/70 px-2 py-2 backdrop-blur-xl dark:border-white/10 dark:bg-[#121816]/80 lg:hidden">
        {links.slice(0, 8).map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={cn("grid justify-items-center gap-1 rounded-md py-1 text-[11px] font-semibold text-ink/55 dark:text-white/55", active && "text-mint")}>
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      {savingsRequired && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 backdrop-blur-md dark:bg-black/55">
          <form onSubmit={submitRequiredSavings} className="w-full max-w-md rounded-lg border border-white/50 bg-white/75 p-6 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[#121816]/85">
            <div className="mb-5 flex items-start gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-mint text-white">
                <PiggyBank />
              </span>
              <div>
                <h2 className="text-xl font-bold">Monthly Savings Required</h2>
                <p className="mt-1 text-sm text-ink/60 dark:text-white/60">
                  You already added wallet money. You must put a Monthly Savings amount before you can continue.
                </p>
              </div>
            </div>
            <div className="mb-4 rounded-md bg-coral/10 p-3 text-sm font-semibold text-coral">
              Please enter your Monthly Savings amount first.
            </div>
            <label className="grid gap-2 text-sm font-semibold">
              Monthly Savings Amount
              <input
                value={requiredSavings}
                onChange={(event) => setRequiredSavings(event.target.value)}
                type="number"
                min="0.01"
                step="0.01"
                autoFocus
                className="h-11 rounded-md border border-ink/10 bg-white px-3 text-base outline-none focus:border-mint dark:border-white/10 dark:bg-white/10"
              />
            </label>
            <Button className="mt-5 w-full" disabled={savingRequiredSavings}>
              {savingRequiredSavings ? "Saving..." : "Save Monthly Savings"}
            </Button>
          </form>
        </div>
      )}
      <Toaster richColors position="top-right" />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <FinanceProvider>
      <ShellInner>{children}</ShellInner>
    </FinanceProvider>
  );
}
