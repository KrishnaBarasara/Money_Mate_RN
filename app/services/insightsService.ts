import { Transaction } from "../utils/types";

export type InsightType = {
  id: string;
  title: string;
  description: string;
  type: "warning" | "success" | "info" | "tip";
  icon: string;
  priority: number;
};

export const generateInsights = (
  transactions: Transaction[],
  monthlyBudget: number
): InsightType[] => {
  const insights: InsightType[] = [];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Filter transactions for current month
  const currentMonthTransactions = transactions.filter((t) => {
    const date = new Date(t.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const expenses = currentMonthTransactions.filter((t) => t.type === "expense");
  const income = currentMonthTransactions.filter((t) => t.type === "income");

  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

  // Budget insight
  if (monthlyBudget > 0) {
    const budgetPercentage = (totalExpenses / monthlyBudget) * 100;
    
    if (budgetPercentage >= 100) {
      insights.push({
        id: "budget-exceeded",
        title: "Budget Exceeded!",
        description: `You've spent ${budgetPercentage.toFixed(0)}% of your monthly budget. Consider reducing expenses.`,
        type: "warning",
        icon: "alert-circle",
        priority: 1,
      });
    } else if (budgetPercentage >= 80) {
      insights.push({
        id: "budget-warning",
        title: "Budget Alert",
        description: `You've used ${budgetPercentage.toFixed(0)}% of your monthly budget. Be mindful of remaining expenses.`,
        type: "warning",
        icon: "warning",
        priority: 2,
      });
    } else if (budgetPercentage <= 50) {
      insights.push({
        id: "budget-good",
        title: "Great Budget Control!",
        description: `You've only used ${budgetPercentage.toFixed(0)}% of your budget. Keep up the good work!`,
        type: "success",
        icon: "checkmark-circle",
        priority: 5,
      });
    }
  }

  // Spending pattern insights
  if (expenses.length > 0) {
    // Find top spending category
    const categorySpending: { [key: string]: number } = {};
    expenses.forEach((t) => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    });

    const topCategory = Object.entries(categorySpending).sort(
      ([, a], [, b]) => b - a
    )[0];

    if (topCategory) {
      const percentage = ((topCategory[1] / totalExpenses) * 100).toFixed(0);
      insights.push({
        id: "top-category",
        title: "Top Expense Category",
        description: `${topCategory[0]} accounts for ${percentage}% of your expenses this month.`,
        type: "info",
        icon: "pie-chart",
        priority: 3,
      });
    }
  }

  // Income vs Expense insight
  if (totalIncome > 0 && totalExpenses > 0) {
    const savingsRate = ((totalIncome - totalExpenses) / totalIncome) * 100;
    
    if (savingsRate >= 20) {
      insights.push({
        id: "savings-good",
        title: "Excellent Savings!",
        description: `You're saving ${savingsRate.toFixed(0)}% of your income. That's great financial discipline!`,
        type: "success",
        icon: "trending-up",
        priority: 2,
      });
    } else if (savingsRate < 0) {
      insights.push({
        id: "overspending",
        title: "Overspending Alert",
        description: `Your expenses exceed your income by ${Math.abs(savingsRate).toFixed(0)}%. Review your spending.`,
        type: "warning",
        icon: "trending-down",
        priority: 1,
      });
    }
  }

  // Tips
  if (expenses.length === 0) {
    insights.push({
      id: "no-expenses",
      title: "Start Tracking",
      description: "Add your first expense to get personalized insights about your spending habits.",
      type: "tip",
      icon: "bulb",
      priority: 4,
    });
  }

  // Sort by priority
  return insights.sort((a, b) => a.priority - b.priority);
};

export const getSpendingByCategory = (
  transactions: Transaction[]
): { category: string; amount: number; percentage: number }[] => {
  const expenses = transactions.filter((t) => t.type === "expense");
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  const categorySpending: { [key: string]: number } = {};
  expenses.forEach((t) => {
    categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
  });

  return Object.entries(categorySpending)
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
};

export const getDailySpending = (
  transactions: Transaction[],
  days: number = 7
): { date: string; amount: number }[] => {
  const result: { date: string; amount: number }[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const dayExpenses = transactions
      .filter((t) => t.type === "expense" && t.date.startsWith(dateStr))
      .reduce((sum, t) => sum + t.amount, 0);

    result.push({
      date: dateStr,
      amount: dayExpenses,
    });
  }

  return result;
};

