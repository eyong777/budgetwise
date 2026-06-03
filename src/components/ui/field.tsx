import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-ink/70 dark:text-white/70">
      {label}
      <input
        className={cn(
          "h-10 rounded-md border border-ink/10 bg-white px-3 text-sm text-ink outline-none transition focus:border-mint dark:border-white/10 dark:bg-white/10 dark:text-white",
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
    <label className="grid gap-1.5 text-sm font-medium text-ink/70 dark:text-white/70">
      {label}
      <select
        className={cn(
          "h-10 rounded-md border border-ink/10 bg-white px-3 text-sm text-ink outline-none transition focus:border-mint dark:border-white/10 dark:bg-white/10 dark:text-white",
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
    <label className="grid gap-1.5 text-sm font-medium text-ink/70 dark:text-white/70">
      {label}
      <textarea
        className={cn(
          "min-h-20 rounded-md border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-mint dark:border-white/10 dark:bg-white/10 dark:text-white",
          className
        )}
        {...props}
      />
    </label>
  );
}
