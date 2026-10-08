import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { useBudgets } from "../context/BudgetContext";
import { useTransactions } from "../context/TransactionContext";
import { useCategories } from "../context/CategoryContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCategoryName } from "../utils/categoryTranslations";
import BudgetProgressBar from "../components/BudgetProgressBar";

const { width } = Dimensions.get("window");

type TimePeriod = "daily" | "weekly" | "monthly" | "halfYear" | "yearly";

export default function BudgetScreen() {
  const { colors } = useThemeColors();
  const { formatAmount } = useCurrency();
  const { monthlyBudget, setMonthlyBudget } = useBudgets();
  const { transactions, getTotalExpenses, getTotalIncome } = useTransactions();
  const { getCategoryByName } = useCategories();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const TIME_PERIODS: { key: TimePeriod; label: string }[] = [
    { key: "daily", label: t("budget.today") },
    { key: "weekly", label: t("budget.week") },
    { key: "monthly", label: t("budget.month") },
    { key: "halfYear", label: t("budget.sixMonths") },
    { key: "yearly", label: t("budget.year") },
  ];

  const [budgetInput, setBudgetInput] = useState(monthlyBudget.toString());
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("monthly");

  const now = new Date();

  // Get date range based on selected period
  const getDateRange = (period: TimePeriod): { start: Date; end: Date } => {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case "daily":
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case "weekly":
        start.setDate(end.getDate() - 7);
        break;
      case "monthly":
        start.setMonth(end.getMonth() - 1);
        break;
      case "halfYear":
        start.setMonth(end.getMonth() - 6);
        break;
      case "yearly":
        start.setFullYear(end.getFullYear() - 1);
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

  // Get expenses only
  const expenses = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === "expense");
  }, [filteredTransactions]);

  // Get income only
  const income = useMemo(() => {
    return filteredTransactions.filter((t) => t.type === "income");
  }, [filteredTransactions]);

  // Calculate totals
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [expenses]);

  const totalIncome = useMemo(() => {
    return income.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [income]);

  // Category-wise breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: {
      [key: string]: {
        amount: number;
        count: number;
        color: string;
        icon: string;
      };
    } = {};

    expenses.forEach((t) => {
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

    // Sort by amount descending
    return Object.entries(breakdown)
      .map(([name, data]) => ({
        name,
        ...data,
        percentage: totalExpenses > 0 ? (data.amount / totalExpenses) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, totalExpenses, getCategoryByName]);

  // Payment mode breakdown
  const paymentModeBreakdown = useMemo(() => {
    const breakdown: { [key: string]: number } = {
      cash: 0,
      upi: 0,
      card: 0,
      bank: 0,
    };
    expenses.forEach((t) => {
      breakdown[t.paymentMode] =
        (breakdown[t.paymentMode] || 0) + (Number(t.amount) || 0);
    });
    return breakdown;
  }, [expenses]);

  // Get period label for display
  const getPeriodLabel = () => {
    const { start, end } = getDateRange(selectedPeriod);
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };

    if (selectedPeriod === "daily") {
      return "Today";
    }
    return `${start.toLocaleDateString(
      "en-US",
      options
    )} - ${end.toLocaleDateString("en-US", options)}`;
  };

  // Calculate average daily spending
  const avgDailySpending = useMemo(() => {
    const { start, end } = getDateRange(selectedPeriod);
    const days = Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    return totalExpenses / days;
  }, [totalExpenses, selectedPeriod]);

  // Monthly budget calculations
  const monthlyTotalSpent = getTotalExpenses(now.getMonth(), now.getFullYear());
  const monthlyTotalIncome = getTotalIncome(now.getMonth(), now.getFullYear());

  const handleSaveBudget = async () => {
    const amount = parseFloat(budgetInput);
    if (isNaN(amount) || amount < 0) {
      showToast(t("addTransaction.pleaseFillAllFields"), "error");
      return;
    }
    await setMonthlyBudget(amount);
    setIsEditing(false);
    showToast(t("budget.budgetSaved"), "success");
  };

  const getPaymentModeIcon = (mode: string) => {
    switch (mode) {
      case "cash":
        return "cash";
      case "upi":
        return "phone-portrait";
      case "card":
        return "card";
      case "bank":
        return "business";
      default:
        return "help-circle";
    }
  };

  const getPaymentModeLabel = (mode: string) => {
    switch (mode) {
      case "cash":
        return "Cash";
      case "upi":
        return "UPI";
      case "card":
        return "Card";
      case "bank":
        return "Bank";
      default:
        return mode;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          {t("budget.budgetAnalytics")}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Monthly Budget Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Ionicons name="wallet" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t("budget.monthlyBudget")}
            </Text>
          </View>

          {isEditing ? (
            <View style={styles.editRow}>
              <TextInput
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="numeric"
                style={[
                  styles.input,
                  {
                    color: colors.text,
                    borderColor: colors.inputBorder,
                    backgroundColor: colors.inputBackground,
                  },
                ]}
                placeholder={t("budget.enterBudget")}
                placeholderTextColor={colors.muted}
              />
              <TouchableOpacity
                onPress={handleSaveBudget}
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveText}>{t("common.save")}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => setIsEditing(true)}
              style={styles.budgetDisplay}
            >
              <Text style={[styles.budgetAmount, { color: colors.text }]}>
                {formatAmount(monthlyBudget)}
              </Text>
              <Ionicons name="pencil" size={20} color={colors.primary} />
            </TouchableOpacity>
          )}

          <View style={styles.progressSection}>
            <View style={styles.statsRow}>
              <View>
                <Text style={[styles.statsLabel, { color: colors.muted }]}>
                  {t("budget.spent")}
                </Text>
                <Text style={[styles.statsValue, { color: colors.danger }]}>
                  {formatAmount(monthlyTotalSpent)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[styles.statsLabel, { color: colors.muted }]}>
                  {t("budget.remaining")}
                </Text>
                <Text style={[styles.statsValue, { color: colors.success }]}>
                  {formatAmount(Math.max(0, monthlyBudget - monthlyTotalSpent))}
                </Text>
              </View>
            </View>
            <BudgetProgressBar
              spent={monthlyTotalSpent}
              limit={monthlyBudget}
            />
          </View>
        </View>

        {/* Time Period Filter */}
        <View style={styles.filterSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("budget.analytics")}
          </Text>
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
                    backgroundColor:
                      selectedPeriod === period.key
                        ? colors.primary
                        : colors.card,
                    borderColor:
                      selectedPeriod === period.key
                        ? colors.primary
                        : colors.cardBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color:
                        selectedPeriod === period.key ? "#fff" : colors.text,
                    },
                  ]}
                >
                  {period.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={[styles.periodLabel, { color: colors.muted }]}>
            {getPeriodLabel()}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons
              name="arrow-down-circle"
              size={24}
              color={colors.danger}
            />
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>
              {t("budget.totalExpenses")}
            </Text>
            <Text style={[styles.summaryAmount, { color: colors.danger }]}>
              {formatAmount(totalExpenses)}
            </Text>
          </View>
          <View
            style={[
              styles.summaryCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="arrow-up-circle" size={24} color={colors.success} />
            <Text style={[styles.summaryLabel, { color: colors.muted }]}>
              {t("budget.totalIncome")}
            </Text>
            <Text style={[styles.summaryAmount, { color: colors.success }]}>
              {formatAmount(totalIncome)}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsRow}>
          <View
            style={[
              styles.quickStatCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="calculator" size={20} color={colors.primary} />
            <Text style={[styles.quickStatLabel, { color: colors.muted }]}>
              {t("budget.avgDaily")}
            </Text>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>
              {formatAmount(avgDailySpending)}
            </Text>
          </View>
          <View
            style={[
              styles.quickStatCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="receipt" size={20} color={colors.warning} />
            <Text style={[styles.quickStatLabel, { color: colors.muted }]}>
              {t("budget.transactions")}
            </Text>
            <Text style={[styles.quickStatValue, { color: colors.text }]}>
              {filteredTransactions.length}
            </Text>
          </View>
          <View
            style={[
              styles.quickStatCard,
              { backgroundColor: colors.card, borderColor: colors.cardBorder },
            ]}
          >
            <Ionicons name="trending-up" size={20} color={colors.success} />
            <Text style={[styles.quickStatLabel, { color: colors.muted }]}>
              {t("budget.net")}
            </Text>
            <Text
              style={[
                styles.quickStatValue,
                {
                  color:
                    totalIncome - totalExpenses >= 0
                      ? colors.success
                      : colors.danger,
                },
              ]}
            >
              {formatAmount(totalIncome - totalExpenses)}
            </Text>
          </View>
        </View>

        {/* Category Breakdown */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: `${colors.warning}15` },
              ]}
            >
              <Ionicons name="pie-chart" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t("budget.spendingByCategory")}
            </Text>
          </View>

          {categoryBreakdown.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="analytics-outline"
                size={40}
                color={colors.muted}
              />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {t("budget.noExpensesInPeriod")}
              </Text>
            </View>
          ) : (
            <>
              {/* Visual Bar Chart */}
              <View style={styles.chartContainer}>
                {categoryBreakdown.slice(0, 5).map((category, index) => (
                  <View key={category.name} style={styles.chartRow}>
                    <View style={styles.chartLabelContainer}>
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: category.color },
                        ]}
                      />
                      <Text
                        style={[styles.chartLabel, { color: colors.text }]}
                        numberOfLines={1}
                      >
                        {translateCategoryName(category.name, t)}
                      </Text>
                    </View>
                    <View style={styles.chartBarContainer}>
                      <View
                        style={[
                          styles.chartBar,
                          {
                            width: `${category.percentage}%`,
                            backgroundColor: category.color,
                          },
                        ]}
                      />
                    </View>
                    <Text style={[styles.chartValue, { color: colors.muted }]}>
                      {category.percentage.toFixed(0)}%
                    </Text>
                  </View>
                ))}
              </View>

              {/* Category List */}
              <View style={styles.categoryList}>
                {categoryBreakdown.map((category) => (
                  <View
                    key={category.name}
                    style={[
                      styles.categoryItem,
                      { borderBottomColor: colors.cardBorder },
                    ]}
                  >
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.categoryIcon,
                          { backgroundColor: `${category.color}20` },
                        ]}
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={18}
                          color={category.color}
                        />
                      </View>
                      <View>
                        <Text
                          style={[styles.categoryName, { color: colors.text }]}
                        >
                          {translateCategoryName(category.name, t)}
                        </Text>
                        <Text
                          style={[
                            styles.categoryCount,
                            { color: colors.muted },
                          ]}
                        >
                          {category.count} transaction
                          {category.count !== 1 ? "s" : ""}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text
                        style={[styles.categoryAmount, { color: colors.text }]}
                      >
                        {formatAmount(category.amount)}
                      </Text>
                      <Text
                        style={[
                          styles.categoryPercent,
                          { color: colors.muted },
                        ]}
                      >
                        {category.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* Payment Mode Breakdown */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: `${colors.success}15` },
              ]}
            >
              <Ionicons name="card" size={20} color={colors.success} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t("budget.paymentMethods")}
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.paymentModeContainer}
          >
            {Object.entries(paymentModeBreakdown).map(([mode, amount]) => (
              <View
                key={mode}
                style={[
                  styles.paymentModeItem,
                  { backgroundColor: colors.inputBackground },
                ]}
              >
                <Ionicons
                  name={getPaymentModeIcon(mode) as any}
                  size={24}
                  color={colors.primary}
                />
                <Text style={[styles.paymentModeLabel, { color: colors.text }]}>
                  {getPaymentModeLabel(mode)}
                </Text>
                <Text
                  style={[styles.paymentModeAmount, { color: colors.muted }]}
                  numberOfLines={1}
                >
                  {formatAmount(amount)}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Insights Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.cardIcon,
                { backgroundColor: `${colors.primary}15` },
              ]}
            >
              <Ionicons name="bulb" size={20} color={colors.primary} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {t("budget.insights")}
            </Text>
          </View>

          <View style={styles.insightsContainer}>
            {categoryBreakdown.length > 0 && (
              <View
                style={[
                  styles.insightItem,
                  { backgroundColor: `${colors.warning}10` },
                ]}
              >
                <Ionicons name="trending-up" size={20} color={colors.warning} />
                <Text style={[styles.insightText, { color: colors.text }]}>
                  {t("budget.topSpendingCategory")
                    .replace("{category}", categoryBreakdown[0]?.name || "")
                    .replace(
                      "{percentage}",
                      categoryBreakdown[0]?.percentage.toFixed(0) || "0"
                    )}
                </Text>
              </View>
            )}

            {monthlyTotalSpent > monthlyBudget && (
              <View
                style={[
                  styles.insightItem,
                  { backgroundColor: `${colors.danger}10` },
                ]}
              >
                <Ionicons name="warning" size={20} color={colors.danger} />
                <Text style={[styles.insightText, { color: colors.text }]}>
                  {t("budget.exceededBudget").replace(
                    "{amount}",
                    formatAmount(monthlyTotalSpent - monthlyBudget)
                  )}
                </Text>
              </View>
            )}

            {monthlyTotalSpent <= monthlyBudget && monthlyBudget > 0 && (
              <View
                style={[
                  styles.insightItem,
                  { backgroundColor: `${colors.success}10` },
                ]}
              >
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={colors.success}
                />
                <Text style={[styles.insightText, { color: colors.text }]}>
                  {t("budget.withinBudget").replace(
                    "{amount}",
                    formatAmount(monthlyBudget - monthlyTotalSpent)
                  )}
                </Text>
              </View>
            )}

            {totalIncome > totalExpenses && (
              <View
                style={[
                  styles.insightItem,
                  { backgroundColor: `${colors.success}10` },
                ]}
              >
                <Ionicons name="happy" size={20} color={colors.success} />
                <Text style={[styles.insightText, { color: colors.text }]}>
                  {t("budget.savedAmount").replace(
                    "{amount}",
                    formatAmount(totalIncome - totalExpenses)
                  )}
                </Text>
              </View>
            )}

            {expenses.length === 0 && (
              <View
                style={[
                  styles.insightItem,
                  { backgroundColor: `${colors.primary}10` },
                ]}
              >
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={colors.primary}
                />
                <Text style={[styles.insightText, { color: colors.text }]}>
                  {t("budget.noExpensesRecorded")}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 28, fontWeight: "800" },
  content: { padding: 20, paddingTop: 0 },

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

  // Budget Section
  editRow: { flexDirection: "row", gap: 12 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: "600",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  budgetDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  budgetAmount: { fontSize: 32, fontWeight: "700" },
  progressSection: { marginTop: 20 },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statsLabel: { fontSize: 12, marginBottom: 4 },
  statsValue: { fontSize: 18, fontWeight: "700" },

  // Filter Section
  filterSection: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  filterContainer: { gap: 8, paddingVertical: 4 },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 14, fontWeight: "600" },
  periodLabel: { fontSize: 12, marginTop: 8 },

  // Summary Cards
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  summaryCard: {
    flex: 1,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  summaryLabel: { fontSize: 12, marginTop: 8 },
  summaryAmount: { fontSize: 20, fontWeight: "700", marginTop: 4 },

  // Quick Stats
  quickStatsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  quickStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  quickStatLabel: { fontSize: 10, marginTop: 6 },
  quickStatValue: { fontSize: 14, fontWeight: "700", marginTop: 2 },

  // Chart Styles
  chartContainer: { marginBottom: 20 },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  chartLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 100,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  chartLabel: { fontSize: 12, flex: 1 },
  chartBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 4,
    marginHorizontal: 8,
    overflow: "hidden",
  },
  chartBar: {
    height: "100%",
    borderRadius: 4,
  },
  chartValue: { fontSize: 12, width: 35, textAlign: "right" },

  // Category List
  categoryList: { marginTop: 8 },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  categoryLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryName: { fontSize: 14, fontWeight: "600" },
  categoryCount: { fontSize: 12, marginTop: 2 },
  categoryRight: { alignItems: "flex-end" },
  categoryAmount: { fontSize: 16, fontWeight: "700" },
  categoryPercent: { fontSize: 12, marginTop: 2 },

  // Payment Mode
  paymentModeContainer: { flexDirection: "row", gap: 10 },
  paymentModeItem: {
    width: 85,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  paymentModeLabel: { fontSize: 11, fontWeight: "600", marginTop: 6 },
  paymentModeAmount: { fontSize: 13, fontWeight: "700", marginTop: 4 },

  // Insights
  insightsContainer: { gap: 12 },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },
  insightText: { flex: 1, fontSize: 14, lineHeight: 20 },

  // Empty State
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: { fontSize: 14, marginTop: 12 },
});
