import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/70 bg-white/75 p-5 shadow-soft backdrop-blur-2xl transition duration-300 hover:-translate-y-0.5 hover:border-mint/25 hover:shadow-[0_26px_80px_rgba(23,32,26,0.14)] dark:border-white/10 dark:bg-white/[0.08] dark:hover:border-mint/25",
        className
      )}
      {...props}
    />
  );
}
