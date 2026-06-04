import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-[linear-gradient(135deg,#17201a_0%,#203328_100%)] text-white shadow-[0_14px_34px_rgba(23,32,26,0.18)] hover:shadow-[0_18px_44px_rgba(23,32,26,0.24)] dark:bg-white dark:text-ink",
    secondary: "border border-white/70 bg-white/75 text-ink shadow-[0_10px_28px_rgba(23,32,26,0.08)] backdrop-blur-xl hover:border-mint/25 hover:bg-white dark:border-white/10 dark:bg-white/10 dark:text-white dark:hover:bg-white/15",
    ghost: "text-ink hover:bg-white/60 hover:shadow-[0_10px_24px_rgba(23,32,26,0.08)] dark:text-white dark:hover:bg-white/10",
    danger: "bg-[linear-gradient(135deg,#e25555_0%,#f06a6a_100%)] text-white shadow-[0_14px_34px_rgba(226,85,85,0.20)] hover:shadow-[0_18px_44px_rgba(226,85,85,0.28)]"
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition duration-300 hover:-translate-y-0.5 active:translate-y-0 disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
