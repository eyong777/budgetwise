import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-white/55 bg-white/70 p-5 shadow-soft backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.08]",
        className
      )}
      {...props}
    />
  );
}
