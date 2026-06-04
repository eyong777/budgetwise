"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Heart, PiggyBank } from "lucide-react";
import { useEffect } from "react";
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
  "/login-photos/login-main.jpg",
  "/login-photos/login-secondary.jpg"
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
    router.replace("/app/dashboard");
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

          <div className="mt-10 grid gap-8 lg:mt-16 lg:grid-cols-[320px_1fr] lg:items-center">
            <div className="relative z-10 max-w-[360px]">
              <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-[4rem]">
                Build the life <span className="text-mint">you love.</span>
              </h1>
              <p className="mt-5 text-lg leading-8 text-ink/65 dark:text-white/65">
                BudgetWise keeps your money clear, personal, and easy to follow every month.
              </p>
            </div>

            <div className="relative min-h-[360px] sm:min-h-[420px] lg:min-h-[520px]">
              <Image
                src={loginPhotos[0]}
                alt=""
                width={320}
                height={470}
                className="absolute right-0 top-0 h-[330px] w-[250px] rounded-lg object-cover object-[center_72%] shadow-soft sm:h-[390px] sm:w-[300px] lg:h-[470px] lg:w-[320px]"
              />
              <Image
                src={loginPhotos[1]}
                alt=""
                width={288}
                height={240}
                className="absolute bottom-0 left-0 h-44 w-60 rounded-lg border-4 border-paper object-cover object-[center_72%] shadow-soft dark:border-[#101412] sm:h-56 sm:w-72 lg:h-60 lg:w-72"
              />
              <div className="absolute right-0 top-64 grid size-14 place-items-center rounded-full bg-coral text-white shadow-soft sm:top-80 lg:top-72">
                <Heart fill="currentColor" size={24} />
              </div>
              <div className="absolute left-4 top-6 max-w-56 rounded-lg border border-white/50 bg-white/70 px-4 py-3 text-sm font-bold shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-[#18201c]/80 sm:left-10">
                Memories worth budgeting for
              </div>
            </div>
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
