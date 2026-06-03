"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, PiggyBank } from "lucide-react";
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

const loginPhotos = [
  "/login-photos/login-photo-1.jpg",
  "/login-photos/login-photo-2.jpg",
  "/login-photos/login-photo-3.jpg",
  "/login-photos/login-photo-4.jpg",
  "/login-photos/login-photo-5.jpg",
  "/login-photos/login-photo-6.jpg"
];

export function AuthForm({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const isRegister = mode === "register";
  const isForgot = mode === "forgot";
  const schema = isForgot
    ? authSchema.pick({ email: true })
    : isRegister
      ? authSchema
      : authSchema.pick({ email: true, password: true });
  const form = useForm<AuthValues>({
    resolver: zodResolver(schema as typeof authSchema),
    defaultValues: { email: "", password: "", fullName: undefined }
  });

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
      error ? toast.error(error.message) : toast.success("Password reset email sent");
      return;
    }

    const result = isRegister
      ? await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: { data: { full_name: values.fullName } }
        })
      : await supabase.auth.signInWithPassword({ email: values.email, password: values.password });

    if (result.error) {
      toast.error(result.error.message);
      return;
    }

    toast.success(isRegister ? "Account created" : "Logged in");
    router.push("/app/dashboard");
  }

  return (
    <div className="min-h-screen bg-paper px-4 py-8 text-ink dark:bg-[#101412] dark:text-white">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_440px]">
        <div className="relative hidden min-h-[650px] overflow-hidden lg:block">
          <Link href="/" className="relative z-10 flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-lg bg-mint text-white">
              <PiggyBank />
            </span>
            <span className="text-2xl font-bold">BudgetWise</span>
          </Link>
          <div className="absolute left-0 top-36 z-10 max-w-[350px]">
            <h1 className="text-6xl font-black leading-tight">
              Build the life <span className="text-mint">you love.</span>
            </h1>
            <p className="mt-5 text-lg leading-8 text-ink/65 dark:text-white/65">
              BudgetWise keeps your money clear, personal, and easy to follow every month.
            </p>
          </div>

          <div className="absolute right-0 top-12 h-[570px] w-[540px]">
            <img
              src={loginPhotos[0]}
              alt=""
              className="absolute right-8 top-12 h-80 w-64 rounded-lg object-cover shadow-soft"
            />
            <img
              src={loginPhotos[1]}
              alt=""
              className="absolute left-10 top-36 h-44 w-56 rounded-lg object-cover shadow-soft"
            />
            <img
              src={loginPhotos[2]}
              alt=""
              className="absolute bottom-20 left-28 h-44 w-52 rounded-lg object-cover shadow-soft"
            />
            <img
              src={loginPhotos[3]}
              alt=""
              className="absolute bottom-4 right-16 h-32 w-32 rounded-full border-4 border-white object-cover shadow-soft dark:border-[#101412]"
            />
            <img
              src={loginPhotos[4]}
              alt=""
              className="absolute right-0 top-0 h-28 w-36 rounded-lg object-cover shadow-soft"
            />
            <img
              src={loginPhotos[5]}
              alt=""
              className="absolute bottom-0 left-0 h-28 w-40 rounded-lg object-cover shadow-soft"
            />
            <div className="absolute right-0 top-52 grid size-16 place-items-center rounded-full bg-coral text-3xl text-white shadow-soft">
              <Heart fill="currentColor" />
            </div>
            <div className="absolute left-0 top-20 rounded-full bg-[#f6c64f] px-3 py-2 text-2xl shadow-soft">
              :)
            </div>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="rounded-lg border border-ink/10 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.06]">
          <div className="mb-6">
            <Link href="/" className="mb-5 flex items-center gap-2 lg:hidden">
              <PiggyBank className="text-mint" />
              <span className="font-bold">BudgetWise</span>
            </Link>
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

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
            {!isRegister && !isForgot && <Link href="/forgot-password" className="font-semibold text-mint">Forgot password?</Link>}
            <Link href={isRegister ? "/login" : "/register"} className="font-semibold text-ink/70 dark:text-white/70">
              {isRegister ? "Already have an account? Log in" : "Create account"}
            </Link>
          </div>
        </form>
      </div>
      <Toaster richColors />
    </div>
  );
}
