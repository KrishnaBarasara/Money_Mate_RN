export type PaymentMode = "cash" | "upi" | "card" | "bank";

export type Transaction = {
  id: string;
  userId: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
  paymentMode: PaymentMode;
  receiptUrl?: string;
  createdAt: string;
};

export type Category = {
  id: string;
  userId: string;
  name: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
  createdAt: string;
};

export type RecurringExpense = {
  id: string;
  userId: string;
  title: string;
  amount: number;
  category: string;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  startDate: string;
  nextDueDate: string;
  paymentMode: PaymentMode;
  isActive: boolean;
  createdAt: string;
};

export type BillReminder = {
  id: string;
  userId: string;
  title: string;
  amount: number;
  dueDate: string;
  category: string;
  isPaid: boolean;
  reminderDate?: string;
  createdAt: string;
};

export type Budget = {
  id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
  createdAt: string;
};

export type UserSettings = {
  currency: string;
  theme: "light" | "dark" | "system";
  notifications: boolean;
  pinEnabled: boolean;
  pin?: string;
};

