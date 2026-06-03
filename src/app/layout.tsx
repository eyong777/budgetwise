import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BudgetWise",
  description: "Modern personal finance SaaS for budgets, wallets, savings, and analytics."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
