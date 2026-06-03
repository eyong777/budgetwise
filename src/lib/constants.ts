import type { Currency, Frequency } from "./types";

export const expenseCategories = [
  "food",
  "transport",
  "shopping",
  "bills",
  "rent",
  "entertainment",
  "healthcare",
  "education",
  "other"
] as const;

export const walletTypes = ["cash", "bank", "savings", "credit"] as const;
export const frequencies: Frequency[] = ["daily", "weekly", "monthly", "yearly"];
export const currencies: Currency[] = ["AED", "USD", "EUR", "GBP", "PHP"];

export const currencySymbols: Record<Currency, string> = {
  AED: "AED",
  USD: "$",
  EUR: "€",
  GBP: "£",
  PHP: "₱"
};
