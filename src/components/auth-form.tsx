"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { PiggyBank } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { toast, Toaster } from "sonner";
import { z } from "zod";
import { authSchema } from "@/lib/validations";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "./ui/button";
import { Field } from "./ui/field";

type AuthMode = "login" | "register" | "forgot";
type AuthValues = z.infer<typeof authSchema>;

const registerSchema = authSchema.extend({
  fullName: z.string().trim().min(2, "Full name must be at least 2 characters.")
});

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const [authMode, setAuthMode] = useState<AuthMode>(mode);
  const isRegister = authMode === "register";
  const isForgot = authMode === "forgot";
  const schema = isForgot
    ? authSchema.pick({ email: true })
    : isRegister
      ? registerSchema
      : authSchema.pick({ email: true, password: true });
  const form = useForm<AuthValues>({
    resolver: zodResolver(schema as typeof authSchema),
    defaultValues: { email: "", password: "", fullName: undefined }
  });

  useEffect(() => {
    setAuthMode(mode);
  }, [mode]);

  useEffect(() => {
    if (isForgot) return;
    let active = true;
    try {
      const supabase = createSupabaseBrowserClient();
      void supabase.auth.getSession().then(({ data }) => {
        if (active && data.session) router.replace("/app/dashboard");
      });
    } catch {
      // Supabase is not configured yet.
    }
    return () => {
      active = false;
    };
  }, [isForgot, router]);

  function onInvalid(errors: FieldErrors<AuthValues>) {
    const firstError = errors.email?.message || errors.password?.message || errors.fullName?.message || "Check the form details.";
    toast.error(String(firstError));
  }

  async function onSubmit(values: AuthValues) {
    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      toast.error("Add Supabase environment variables to enable authentication.");
      return;
    }

    if (isForgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/app/settings`
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password reset email sent");
      }
      return;
    }

    if (isRegister && (values.fullName?.trim().length ?? 0) < 2) {
      toast.error("Full name must be at least 2 characters.");
      return;
    }

    const result = isRegister
      ? await supabase.auth.signUp({
          email: values.email.trim(),
          password: values.password,
          options: { data: { full_name: values.fullName?.trim() } }
        })
      : await supabase.auth.signInWithPassword({ email: values.email.trim(), password: values.password });

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    if (isRegister) {
      if (result.data.session) {
        await supabase.auth.signOut();
      }
      toast.success(result.data.session ? "Account created. Please log in." : "Account created. Please check your email if confirmation is enabled.");
      setAuthMode("login");
      form.reset({ email: values.email.trim(), password: "", fullName: undefined });
      return;
    }

    toast.success("Logged in");
    router.refresh();
    window.location.assign("/app/dashboard");
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-8 text-ink dark:bg-[#101412] dark:text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <div className="relative overflow-hidden">
          <Link href="/" className="relative z-10 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-lg bg-mint text-white">
              <PiggyBank />
            </span>
            <span className="text-2xl font-bold">BudgetWise</span>
          </Link>

          <div className="relative z-10 mt-10 max-w-xl lg:mt-16">
            <p className="mb-4 inline-flex rounded-full bg-mint/10 px-4 py-2 text-sm font-bold text-mint">
              Personal finance made clear
            </p>
            <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-[4.2rem]">
              Build the life <span className="text-mint">you love.</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-8 text-ink/65 dark:text-white/65">
              BudgetWise keeps your wallet, budgets, expenses, and savings easy to follow every month.
            </p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="rounded-lg border border-white/55 bg-white/70 p-6 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08]">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{isForgot ? "Reset password" : isRegister ? "Create account" : "Log in"}</h2>
            <p className="mt-1 text-sm text-ink/55 dark:text-white/55">
              {isForgot ? "We will email you a recovery link." : "Use your email and password to continue."}
            </p>
          </div>

          <div className="grid gap-4">
            {isRegister && (
              <div className="grid gap-1">
                <Field label="Full name" {...form.register("fullName")} />
                {form.formState.errors.fullName && <p className="text-xs font-semibold text-coral">{form.formState.errors.fullName.message}</p>}
              </div>
            )}
            <div className="grid gap-1">
              <Field label="Email" type="email" autoComplete="email" {...form.register("email")} />
              {form.formState.errors.email && <p className="text-xs font-semibold text-coral">{form.formState.errors.email.message}</p>}
            </div>
            {!isForgot && (
              <div className="grid gap-1">
                <Field label="Password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} {...form.register("password")} />
                {form.formState.errors.password && <p className="text-xs font-semibold text-coral">{form.formState.errors.password.message}</p>}
              </div>
            )}
          </div>

          <Button className="mt-6 w-full" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Working..." : isForgot ? "Send recovery link" : isRegister ? "Create BudgetWise account" : "Log in"}
          </Button>

          {!isRegister && !isForgot && (
            <Button
              type="button"
              variant="secondary"
              className="mt-3 h-11 w-full"
              onClick={() => {
                setAuthMode("register");
                form.reset({ email: "", password: "", fullName: "" });
              }}
            >
              Create account
            </Button>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            {!isRegister && !isForgot && <Link href="/forgot-password" className="font-semibold text-mint">Forgot password?</Link>}
            {isRegister && (
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  form.reset({ email: "", password: "", fullName: undefined });
                }}
                className="rounded-md px-3 py-2 font-semibold text-mint hover:bg-mint/10"
              >
                Already have an account? Log in
              </button>
            )}
          </div>
        </form>
      </div>
      <Toaster richColors />
    </div>
  );
}
