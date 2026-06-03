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
          "h-10 w-full min-w-0 rounded-md border border-white/60 bg-white/65 px-3 text-sm text-ink outline-none backdrop-blur transition focus:border-mint dark:border-white/10 dark:bg-white/10 dark:text-white",
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
          "h-10 w-full min-w-0 rounded-md border border-white/60 bg-white/65 px-3 text-sm text-ink outline-none backdrop-blur transition focus:border-mint dark:border-white/10 dark:bg-white/10 dark:text-white",
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
          "min-h-20 w-full min-w-0 rounded-md border border-white/60 bg-white/65 px-3 py-2 text-sm text-ink outline-none backdrop-blur transition focus:border-mint dark:border-white/10 dark:bg-white/10 dark:text-white",
          className
        )}
        {...props}
      />
    </label>
  );
}
