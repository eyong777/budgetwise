"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  CheckCircle2,
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
import { Toaster } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Currency } from "@/lib/types";
import { cn, money } from "@/lib/utils";
import { FinanceProvider, useFinance } from "./finance-provider";
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
  const { currency, dismissSalaryAllocation, loading, profile, salaryAllocation } = useFinance();
  const [dark, setDark] = useState(false);
  const [showLoader, setShowLoader] = useState(loading);
  const activeCurrency = currency as Currency;

  useEffect(() => {
    const stored = localStorage.getItem("budgetwise-theme");
    const enabled = stored === "dark";
    setDark(enabled);
    document.documentElement.classList.toggle("dark", enabled);
  }, []);

  useEffect(() => {
    let timeout: number | undefined;

    if (loading) {
      setShowLoader(true);
    } else if (showLoader) {
      timeout = window.setTimeout(() => setShowLoader(false), 180);
    }

    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, [loading, showLoader]);

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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_14%_0%,rgba(40,168,107,0.16),transparent_30%),linear-gradient(135deg,#f7f8f4_0%,#eef7f1_48%,#f7f8f4_100%)] text-ink dark:bg-[radial-gradient(circle_at_14%_0%,rgba(40,168,107,0.12),transparent_30%),linear-gradient(135deg,#101412_0%,#132018_52%,#101412_100%)] dark:text-white">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/55 bg-white/62 p-4 shadow-soft backdrop-blur-2xl dark:border-white/10 dark:bg-[#121816]/72 lg:block">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-ink/65 transition duration-300 hover:-translate-y-0.5 hover:bg-white/65 hover:shadow-[0_12px_30px_rgba(23,32,26,0.08)] dark:text-white/65 dark:hover:bg-white/10",
                  active && "border border-mint/20 bg-mint/[0.12] text-mint shadow-[0_14px_36px_rgba(40,168,107,0.12)] dark:text-mint"
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
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-white/55 bg-white/55 px-4 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-[#101412]/62 sm:px-6">
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

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-white/55 bg-white/78 px-2 py-2 shadow-[0_-18px_46px_rgba(23,32,26,0.10)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#121816]/82 lg:hidden">
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
      {salaryAllocation ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/45 px-4 backdrop-blur-md dark:bg-black/55">
          <div className="w-full max-w-lg rounded-2xl border border-white/85 bg-white/95 p-5 text-ink shadow-[0_30px_90px_rgba(23,32,26,0.24)] backdrop-blur-xl dark:border-white/10 dark:bg-[#121816]/95 dark:text-white sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl border border-mint/25 bg-mint/10 text-mint shadow-[0_18px_44px_rgba(40,168,107,0.18)]">
                <CheckCircle2 size={30} />
              </span>
              <div>
                <h2 className="text-2xl font-black leading-tight tracking-normal">Salary Allocated Successfully</h2>
                <p className="mt-2 text-sm leading-6 text-ink/58 dark:text-white/65">
                  Your salary has been processed automatically.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 rounded-xl border border-ink/10 bg-white p-4 text-sm leading-6 text-ink/78 shadow-[inset_0_1px_0_rgba(255,255,255,0.78)] dark:border-white/10 dark:bg-white/[0.08] dark:text-white/78">
              <p>{money(salaryAllocation.budgetReservedAmount, activeCurrency)} has been reserved for this month&apos;s budget.</p>
              <p>{money(salaryAllocation.savingsAmount, activeCurrency)} has been automatically transferred to Savings.</p>
              <p>All remaining funds have been secured in Savings.</p>
            </div>

            <div className="mt-5 rounded-xl border border-mint/20 bg-mint/[0.10] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:border-mint/20 dark:bg-mint/[0.10]">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-mint">Summary</p>
              <div className="mt-3 grid gap-2 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink/55 dark:text-white/60">Salary Added</span>
                  <strong>{money(salaryAllocation.salaryAmount, activeCurrency)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink/55 dark:text-white/60">Budget Reserved</span>
                  <strong>{money(salaryAllocation.budgetReservedAmount, activeCurrency)}</strong>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-ink/55 dark:text-white/60">Moved to Savings</span>
                  <strong className="text-mint">{money(salaryAllocation.savingsAmount, activeCurrency)}</strong>
                </div>
              </div>
            </div>

            <Button className="mt-5 h-12 w-full border border-mint/30 bg-mint text-base font-bold text-white shadow-glow hover:bg-mint/90" onClick={dismissSalaryAllocation}>
              OK
            </Button>
          </div>
        </div>
      ) : null}
      {showLoader ? (
        <div
          className={cn(
            "budgetwise-loader pointer-events-none fixed inset-0 z-40 grid place-items-center bg-white/35 backdrop-blur-[2px] dark:bg-black/20",
            !loading && "budgetwise-loader-done"
          )}
        >
          <div className="grid justify-items-center gap-3 rounded-2xl border border-white/70 bg-white/42 px-8 py-7 shadow-[0_24px_80px_rgba(23,32,26,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08]">
            <div className="budgetwise-spinner" aria-hidden="true" />
            <p className="text-sm font-bold text-ink/65 dark:text-white/70">Loading BudgetWise</p>
          </div>
        </div>
      ) : null}
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
