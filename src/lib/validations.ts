import { z } from "zod";
import { expenseCategories, frequencies, walletTypes } from "./constants";

export const authSchema = z.object({
  fullName: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(8)
});

export const walletSchema = z.object({
  name: z.string().min(2),
  type: z.enum(walletTypes),
  balance: z.coerce.number().min(0)
});

export const transactionSchema = z.object({
  amount: z.coerce.number().positive(),
  category: z.enum(expenseCategories),
  wallet_id: z.string().min(1),
  description: z.string().optional(),
  date: z.string().min(1)
});

export const budgetSchema = z.object({
  category: z.enum(expenseCategories),
  limit_amount: z.coerce.number().positive(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100)
});

export const monthlySavingsSchema = z.object({
  monthly_savings: z.coerce.number().min(0),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100)
});

export const recurringSchema = z.object({
  amount: z.coerce.number().positive(),
  category: z.enum(expenseCategories),
  wallet_id: z.string().min(1),
  description: z.string().optional(),
  frequency: z.enum(frequencies as [string, ...string[]]),
  next_run: z.string().min(1)
});
