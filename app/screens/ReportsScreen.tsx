import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { useTransactions } from "../context/TransactionContext";
import { useCategories } from "../context/CategoryContext";
import { useBudgets } from "../context/BudgetContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCategoryName } from "../utils/categoryTranslations";
import ScreenHeader from "../components/ScreenHeader";

type TimePeriod = "week" | "month" | "quarter" | "year";

export default function ReportsScreen() {
  const { colors } = useThemeColors();
  const { formatAmount } = useCurrency();
  const { transactions } = useTransactions();
  const { getCategoryByName } = useCategories();
  const { t } = useLanguage();
  const { monthlyBudget } = useBudgets();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month");

  const TIME_PERIODS: { key: TimePeriod; label: string }[] = [
    { key: "week", label: t("reports.thisWeek") },
    { key: "month", label: t("reports.thisMonth") },
    { key: "quarter", label: t("reports.quarter") },
    { key: "year", label: t("reports.thisYear") },
  ];

  // Get date range based on selected period
  const getDateRange = (period: TimePeriod): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case "week":
        start.setDate(end.getDate() - 7);
        break;
      case "month":
        start.setMonth(end.getMonth(), 1);
        start.setHours(0, 0, 0, 0);
        break;
      case "quarter":
        start.setMonth(end.getMonth() - 3);
        break;
      case "year":
        start.setFullYear(end.getFullYear(), 0, 1);
        start.setHours(0, 0, 0, 0);
        break;
    }
    return { start, end };
  };

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    return transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    });
  }, [transactions, selectedPeriod]);

  // Calculate totals
  const totalIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const totalExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const netSavings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0;

  // Category breakdown for expenses
  const categoryBreakdown = useMemo(() => {
    const breakdown: { [key: string]: { amount: number; count: number; color: string; icon: string } } = {};
    
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const category = getCategoryByName(t.category);
        if (!breakdown[t.category]) {
          breakdown[t.category] = {
            amount: 0,
            count: 0,
            color: category?.color || "#6366F1",
            icon: category?.icon || "help-circle",
          };
        }
        breakdown[t.category].amount += Number(t.amount) || 0;
        breakdown[t.category].count += 1;
      });

    return Object.entries(breakdown)
      .map(([name, data]) => ({
        name,
        ...data,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, totalExpenses, getCategoryByName]);

  // Income category breakdown
  const incomeCategoryBreakdown = useMemo(() => {
    const breakdown: { [key: string]: { amount: number; count: number; color: string; icon: string } } = {};
    
    filteredTransactions
      .filter((t) => t.type === "income")
      .forEach((t) => {
        const category = getCategoryByName(t.category);
        if (!breakdown[t.category]) {
          breakdown[t.category] = {
            amount: 0,
            count: 0,
            color: category?.color || "#22C55E",
            icon: category?.icon || "help-circle",
          };
        }
        breakdown[t.category].amount += Number(t.amount) || 0;
        breakdown[t.category].count += 1;
      });

    return Object.entries(breakdown)
      .map(([name, data]) => ({
        name,
        ...data,
        percentage: totalIncome > 0 ? (data.amount / totalIncome) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, totalIncome, getCategoryByName]);

  // Payment mode breakdown
  const paymentModeBreakdown = useMemo(() => {
    const breakdown: { [key: string]: number } = { cash: 0, upi: 0, card: 0, bank: 0 };
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        breakdown[t.paymentMode] = (breakdown[t.paymentMode] || 0) + (Number(t.amount) || 0);
      });
    return breakdown;
  }, [filteredTransactions]);

  // Daily spending pattern
  const dailySpending = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    return totalExpenses / days;
  }, [totalExpenses, selectedPeriod]);

  // Weekly spending pattern
  const weeklySpending = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    const weeks = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)));
    return totalExpenses / weeks;
  }, [totalExpenses, selectedPeriod]);

  // Month comparison (current vs previous)
  const monthComparison = useMemo(() => {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthExpenses = transactions
      .filter((t) => {
        const date = new Date(t.date);
        return t.type === "expense" && date >= currentMonthStart && date <= now;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const prevMonthExpenses = transactions
      .filter((t) => {
        const date = new Date(t.date);
        return t.type === "expense" && date >= prevMonthStart && date <= prevMonthEnd;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const change = prevMonthExpenses > 0 
      ? ((currentMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100 
      : 0;

    return { current: currentMonthExpenses, previous: prevMonthExpenses, change };
  }, [transactions]);

  // Highest spending day
  const highestSpendingDay = useMemo(() => {
    const dayTotals: { [key: string]: number } = {};
    
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const dateKey = new Date(t.date).toDateString();
        dayTotals[dateKey] = (dayTotals[dateKey] || 0) + (Number(t.amount) || 0);
      });

    let maxDay = "";
    let maxAmount = 0;
    Object.entries(dayTotals).forEach(([day, amount]) => {
      if (amount > maxAmount) {
        maxDay = day;
        maxAmount = amount;
      }
    });

    return { day: maxDay, amount: maxAmount };
  }, [filteredTransactions]);

  // Transaction count by type
  const transactionCounts = useMemo(() => {
    const income = filteredTransactions.filter((t) => t.type === "income").length;
    const expense = filteredTransactions.filter((t) => t.type === "expense").length;
    return { income, expense, total: income + expense };
  }, [filteredTransactions]);

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case "cash": return "cash";
      case "upi": return "phone-portrait";
      case "card": return "card";
      case "bank": return "business";
      default: return "help-circle";
    }
  };

  const getPaymentModeLabel = (mode: string) => {
    switch (mode) {
      case "cash": return "Cash";
      case "upi": return "UPI";
      case "card": return "Card";
      case "bank": return "Bank";
      default: return mode;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t("reports.title")} />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Time Period Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContainer}
        >
          {TIME_PERIODS.map((period) => (
            <TouchableOpacity
              key={period.key}
              onPress={() => setSelectedPeriod(period.key)}
              style={[
                styles.filterButton,
                {
                  backgroundColor: selectedPeriod === period.key ? colors.primary : colors.card,
                  borderColor: selectedPeriod === period.key ? colors.primary : colors.cardBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: selectedPeriod === period.key ? "#fff" : colors.text },
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Overview Summary Card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="stats-chart" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t("reports.overview")}</Text>
          </View>

          <View style={styles.overviewGrid}>
            <View style={[styles.overviewItem, { backgroundColor: `${colors.success}10` }]}>
              <Ionicons name="arrow-up-circle" size={24} color={colors.success} />
              <Text style={[styles.overviewLabel, { color: colors.muted }]}>{t("dashboard.income")}</Text>
              <Text style={[styles.overviewValue, { color: colors.success }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(totalIncome)}
              </Text>
            </View>
            <View style={[styles.overviewItem, { backgroundColor: `${colors.danger}10` }]}>
              <Ionicons name="arrow-down-circle" size={24} color={colors.danger} />
              <Text style={[styles.overviewLabel, { color: colors.muted }]}>{t("dashboard.expenses")}</Text>
              <Text style={[styles.overviewValue, { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(totalExpenses)}
              </Text>
            </View>
            <View style={[styles.overviewItem, { backgroundColor: `${netSavings >= 0 ? colors.success : colors.danger}10` }]}>
              <Ionicons name="wallet" size={24} color={netSavings >= 0 ? colors.success : colors.danger} />
              <Text style={[styles.overviewLabel, { color: colors.muted }]}>{t("reports.netSavings")}</Text>
              <Text style={[styles.overviewValue, { color: netSavings >= 0 ? colors.success : colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(netSavings)}
              </Text>
            </View>
            <View style={[styles.overviewItem, { backgroundColor: `${colors.primary}10` }]}>
              <Ionicons name="trending-up" size={24} color={colors.primary} />
              <Text style={[styles.overviewLabel, { color: colors.muted }]}>{t("reports.savingsRate")}</Text>
              <Text style={[styles.overviewValue, { color: colors.primary }]} numberOfLines={1} adjustsFontSizeToFit>
                {savingsRate.toFixed(1)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Spending Averages */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="calculator" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t("reports.spendingAverages")}</Text>
          </View>

          <View style={styles.averagesRow}>
            <View style={styles.averageItem}>
              <Text style={[styles.averageLabel, { color: colors.muted }]}>{t("reports.dailyAverage")}</Text>
              <Text style={[styles.averageValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(dailySpending)}
              </Text>
            </View>
            <View style={[styles.averageDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.averageItem}>
              <Text style={[styles.averageLabel, { color: colors.muted }]}>{t("reports.weeklyAverage")}</Text>
              <Text style={[styles.averageValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(weeklySpending)}
              </Text>
            </View>
          </View>
        </View>

        {/* Month Comparison */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="git-compare" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t("reports.monthComparison")}</Text>
          </View>

          <View style={styles.comparisonRow}>
            <View style={styles.comparisonItem}>
              <Text style={[styles.comparisonLabel, { color: colors.muted }]}>{t("reports.lastMonth")}</Text>
              <Text style={[styles.comparisonValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(monthComparison.previous)}
              </Text>
            </View>
            <View style={styles.comparisonArrow}>
              <Ionicons
                name={monthComparison.change > 0 ? "arrow-up" : "arrow-down"}
                size={24}
                color={monthComparison.change > 0 ? colors.danger : colors.success}
              />
              <Text
                style={[
                  styles.comparisonChange,
                  { color: monthComparison.change > 0 ? colors.danger : colors.success },
                ]}
              >
                {Math.abs(monthComparison.change).toFixed(1)}%
              </Text>
            </View>
            <View style={styles.comparisonItem}>
              <Text style={[styles.comparisonLabel, { color: colors.muted }]}>{t("reports.thisMonth")}</Text>
              <Text style={[styles.comparisonValue, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(monthComparison.current)}
              </Text>
            </View>
          </View>
        </View>

        {/* Top Expense Categories */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: `${colors.danger}15` }]}>
              <Ionicons name="pie-chart" size={20} color={colors.danger} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t("reports.topExpenseCategories")}</Text>
          </View>

          {categoryBreakdown.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.muted }]}>{t("reports.noExpensesInPeriod")}</Text>
          ) : (
            categoryBreakdown.slice(0, 5).map((category, index) => (
              <View key={category.name} style={styles.categoryRow}>
                <View style={styles.categoryLeft}>
                  <Text style={[styles.categoryRank, { color: colors.muted }]}>#{index + 1}</Text>
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                    <Ionicons name={category.icon as any} size={18} color={category.color} />
                  </View>
                  <View>
                    <Text style={[styles.categoryName, { color: colors.text }]}>{translateCategoryName(category.name, t)}</Text>
                    <Text style={[styles.categoryCount, { color: colors.muted }]}>
                      {category.count} {category.count !== 1 ? t("reports.transactions") : t("reports.transaction")}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={[styles.categoryAmount, { color: colors.text }]}>
                    {formatAmount(category.amount)}
                  </Text>
                  <Text style={[styles.categoryPercent, { color: colors.muted }]}>
                    {category.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Income Sources */}
        {incomeCategoryBreakdown.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: `${colors.success}15` }]}>
                <Ionicons name="cash" size={20} color={colors.success} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>{t("reports.incomeSources")}</Text>
            </View>

            {incomeCategoryBreakdown.map((category, index) => (
              <View key={category.name} style={styles.categoryRow}>
                <View style={styles.categoryLeft}>
                  <Text style={[styles.categoryRank, { color: colors.muted }]}>#{index + 1}</Text>
                  <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
                    <Ionicons name={category.icon as any} size={18} color={category.color} />
                  </View>
                  <View>
                    <Text style={[styles.categoryName, { color: colors.text }]}>{translateCategoryName(category.name, t)}</Text>
                    <Text style={[styles.categoryCount, { color: colors.muted }]}>
                      {category.count} {category.count !== 1 ? t("reports.transactions") : t("reports.transaction")}
                    </Text>
                  </View>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={[styles.categoryAmount, { color: colors.success }]}>
                    {formatAmount(category.amount)}
                  </Text>
                  <Text style={[styles.categoryPercent, { color: colors.muted }]}>
                    {category.percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Payment Methods */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: `${colors.primary}15` }]}>
              <Ionicons name="card" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t("reports.paymentMethods")}</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paymentGrid}
          >
            {Object.entries(paymentModeBreakdown).map(([mode, amount]) => (
              <View
                key={mode}
                style={[styles.paymentItem, { backgroundColor: colors.inputBackground }]}
              >
                <Ionicons name={getPaymentModeIcon(mode) as any} size={24} color={colors.primary} />
                <Text style={[styles.paymentLabel, { color: colors.text }]}>
                  {getPaymentModeLabel(mode)}
                </Text>
                <Text style={[styles.paymentAmount, { color: colors.muted }]} numberOfLines={1}>
                  {formatAmount(amount)}
                </Text>
                {totalExpenses > 0 && (
                  <Text style={[styles.paymentPercent, { color: colors.primary }]}>
                    {((amount / totalExpenses) * 100).toFixed(0)}%
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Transaction Stats */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: `${colors.warning}15` }]}>
              <Ionicons name="receipt" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>{t("reports.transactionStatistics")}</Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.primary }]}>
                {transactionCounts.total}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{t("reports.total")}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.success }]}>
                {transactionCounts.income}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{t("dashboard.income")}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: colors.danger }]}>
                {transactionCounts.expense}
              </Text>
              <Text style={[styles.statLabel, { color: colors.muted }]}>{t("dashboard.expense")}</Text>
            </View>
          </View>

          {highestSpendingDay.day && (
            <View style={[styles.highlightBox, { backgroundColor: `${colors.warning}10` }]}>
              <Ionicons name="flame" size={20} color={colors.warning} />
              <View style={styles.highlightText}>
                <Text style={[styles.highlightLabel, { color: colors.muted }]}>
                  Highest Spending Day
                </Text>
                <Text style={[styles.highlightValue, { color: colors.text }]}>
                  {new Date(highestSpendingDay.day).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })} - {formatAmount(highestSpendingDay.amount)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Budget Progress */}
        {monthlyBudget > 0 && (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: `${colors.primary}15` }]}>
                <Ionicons name="wallet" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Budget Status</Text>
            </View>

            <View style={styles.budgetInfo}>
              <View style={styles.budgetRow}>
                <Text style={[styles.budgetLabel, { color: colors.muted }]}>Monthly Budget</Text>
                <Text style={[styles.budgetValue, { color: colors.text }]}>
                  {formatAmount(monthlyBudget)}
                </Text>
              </View>
              <View style={styles.budgetRow}>
                <Text style={[styles.budgetLabel, { color: colors.muted }]}>Spent (This Month)</Text>
                <Text style={[styles.budgetValue, { color: colors.danger }]}>
                  {formatAmount(monthComparison.current)}
                </Text>
              </View>
              <View style={styles.budgetRow}>
                <Text style={[styles.budgetLabel, { color: colors.muted }]}>Remaining</Text>
                <Text
                  style={[
                    styles.budgetValue,
                    { color: monthlyBudget - monthComparison.current >= 0 ? colors.success : colors.danger },
                  ]}
                >
                  {formatAmount(Math.max(0, monthlyBudget - monthComparison.current))}
                </Text>
              </View>

              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { backgroundColor: colors.inputBackground }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${Math.min(100, (monthComparison.current / monthlyBudget) * 100)}%`,
                        backgroundColor:
                          monthComparison.current > monthlyBudget ? colors.danger : colors.primary,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.muted }]}>
                  {((monthComparison.current / monthlyBudget) * 100).toFixed(0)}% used
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 0 },
  filterContainer: { gap: 8, paddingVertical: 16 },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 14, fontWeight: "600" },

  // Card Styles
  card: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  cardTitle: { fontSize: 18, fontWeight: "700" },

  // Overview Grid
  overviewGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  overviewItem: {
    width: "48%",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  overviewLabel: { fontSize: 11, marginTop: 6 },
  overviewValue: { fontSize: 16, fontWeight: "700", marginTop: 2 },

  // Averages
  averagesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  averageItem: { flex: 1, alignItems: "center" },
  averageDivider: { width: 1, height: 40, marginHorizontal: 16 },
  averageLabel: { fontSize: 12, marginBottom: 4 },
  averageValue: { fontSize: 20, fontWeight: "700" },

  // Comparison
  comparisonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  comparisonItem: { flex: 1, alignItems: "center" },
  comparisonLabel: { fontSize: 12, marginBottom: 4 },
  comparisonValue: { fontSize: 18, fontWeight: "700" },
  comparisonArrow: { alignItems: "center", paddingHorizontal: 16 },
  comparisonChange: { fontSize: 14, fontWeight: "600", marginTop: 2 },

  // Category Row
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  categoryLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  categoryRank: { fontSize: 14, fontWeight: "600", width: 28 },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryName: { fontSize: 14, fontWeight: "600" },
  categoryCount: { fontSize: 12, marginTop: 2 },
  categoryRight: { alignItems: "flex-end" },
  categoryAmount: { fontSize: 16, fontWeight: "700" },
  categoryPercent: { fontSize: 12, marginTop: 2 },

  // Payment Grid
  paymentGrid: {
    flexDirection: "row",
    gap: 10,
  },
  paymentItem: {
    width: 90,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  paymentLabel: { fontSize: 11, fontWeight: "600", marginTop: 6 },
  paymentAmount: { fontSize: 13, fontWeight: "700", marginTop: 2 },
  paymentPercent: { fontSize: 10, marginTop: 2 },

  // Stats Grid
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statItem: { alignItems: "center" },
  statNumber: { fontSize: 28, fontWeight: "800" },
  statLabel: { fontSize: 12, marginTop: 4 },

  // Highlight Box
  highlightBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  highlightText: { flex: 1 },
  highlightLabel: { fontSize: 12 },
  highlightValue: { fontSize: 14, fontWeight: "600", marginTop: 2 },

  // Budget Info
  budgetInfo: {},
  budgetRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
  },
  budgetLabel: { fontSize: 14 },
  budgetValue: { fontSize: 16, fontWeight: "700" },
  progressContainer: { marginTop: 12 },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 4 },
  progressText: { fontSize: 12, textAlign: "right", marginTop: 6 },

  emptyText: { fontSize: 14, textAlign: "center", paddingVertical: 20 },
});
