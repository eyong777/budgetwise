import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variants = {
    primary: "bg-ink text-white hover:bg-black dark:bg-white dark:text-ink",
    secondary: "border border-ink/10 bg-white text-ink hover:bg-ink/5 dark:border-white/10 dark:bg-white/10 dark:text-white",
    ghost: "text-ink hover:bg-ink/5 dark:text-white dark:hover:bg-white/10",
    danger: "bg-coral text-white hover:bg-red-600"
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
