import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { currencySymbols } from "./constants";
import type { Currency } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(value: number, currency: Currency = "USD") {
  const symbol = currencySymbols[currency];
  return `${symbol} ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function pct(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

export function monthKey(date = new Date()) {
  return { month: date.getMonth() + 1, year: date.getFullYear() };
}
