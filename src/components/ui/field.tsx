import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink/70 dark:text-white/70">
      {label}
      <input
        className={cn(
          "h-10 w-full min-w-0 rounded-lg border border-white/70 bg-white/75 px-3 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none backdrop-blur-xl transition duration-300 placeholder:text-ink/35 focus:border-mint/55 focus:bg-white focus:shadow-[0_0_0_4px_rgba(40,168,107,0.12)] dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:bg-white/15",
          className
        )}
        {...props}
      />
    </label>
  );
}

export function SelectField({
  label,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink/70 dark:text-white/70">
      {label}
      <select
        className={cn(
          "h-10 w-full min-w-0 rounded-lg border border-white/70 bg-white/75 px-3 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none backdrop-blur-xl transition duration-300 focus:border-mint/55 focus:bg-white focus:shadow-[0_0_0_4px_rgba(40,168,107,0.12)] dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:bg-white/15",
          className
        )}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function TextAreaField({
  label,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink/70 dark:text-white/70">
      {label}
      <textarea
        className={cn(
          "min-h-20 w-full min-w-0 rounded-lg border border-white/70 bg-white/75 px-3 py-2 text-sm text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] outline-none backdrop-blur-xl transition duration-300 placeholder:text-ink/35 focus:border-mint/55 focus:bg-white focus:shadow-[0_0_0_4px_rgba(40,168,107,0.12)] dark:border-white/10 dark:bg-white/10 dark:text-white dark:focus:bg-white/15",
          className
        )}
        {...props}
      />
    </label>
  );
}
