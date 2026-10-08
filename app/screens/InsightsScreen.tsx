import React, { useState, useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { useTransactions } from "../context/TransactionContext";
import { useBudgets } from "../context/BudgetContext";
import { useCategories } from "../context/CategoryContext";
import { useRecurringExpenses } from "../context/RecurringExpenseContext";
import { useBillReminders } from "../context/BillReminderContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCategoryName } from "../utils/categoryTranslations";
import ScreenHeader from "../components/ScreenHeader";

type InsightType = "success" | "warning" | "danger" | "info" | "tip";
type TimePeriod = "week" | "month" | "quarter" | "year";

type Insight = {
  id: string;
  type: InsightType;
  icon: string;
  title: string;
  description: string;
  value?: string;
};

export default function InsightsScreen() {
  const { colors } = useThemeColors();
  const { formatAmount } = useCurrency();
  const { transactions } = useTransactions();
  const { monthlyBudget } = useBudgets();
  const { getCategoryByName } = useCategories();
  const { recurringExpenses } = useRecurringExpenses();
  const { billReminders } = useBillReminders();
  const { t } = useLanguage();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>("month");

  const TIME_PERIODS: { key: TimePeriod; label: string }[] = [
    { key: "week", label: t("insights.thisWeek") },
    { key: "month", label: t("insights.thisMonth") },
    { key: "quarter", label: t("insights.quarter") },
    { key: "year", label: t("insights.thisYear") },
  ];

  const now = new Date();

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

  // Calculate totals for selected period
  const periodIncome = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const periodExpenses = useMemo(() => {
    return filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [filteredTransactions]);

  const netSavings = periodIncome - periodExpenses;

  // Previous period data for comparison
  const getPrevPeriodRange = (period: TimePeriod): { start: Date; end: Date } => {
    const current = getDateRange(period);
    const duration = current.end.getTime() - current.start.getTime();
    return {
      start: new Date(current.start.getTime() - duration),
      end: new Date(current.start.getTime() - 1),
    };
  };

  const prevPeriodExpenses = useMemo(() => {
    const { start, end } = getPrevPeriodRange(selectedPeriod);
    return transactions
      .filter((t) => {
        const date = new Date(t.date);
        return t.type === "expense" && date >= start && date <= end;
      })
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [transactions, selectedPeriod]);

  // Generate comprehensive insights
  const insights = useMemo(() => {
    const generatedInsights: Insight[] = [];
    const { start, end } = getDateRange(selectedPeriod);
    const daysInPeriod = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const daysPassed = Math.max(1, Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

    // 1. Budget Status (only for month period)
    if (selectedPeriod === "month" && monthlyBudget > 0) {
      const budgetUsed = (periodExpenses / monthlyBudget) * 100;
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const expectedUsage = (now.getDate() / daysInMonth) * 100;

      if (periodExpenses > monthlyBudget) {
        generatedInsights.push({
          id: "budget-exceeded",
          type: "danger",
          icon: "alert-circle",
          title: t("insights.budgetExceeded"),
          description: t("insights.budgetExceededDesc").replace("{amount}", formatAmount(periodExpenses - monthlyBudget)),
          value: formatAmount(periodExpenses - monthlyBudget),
        });
      } else if (budgetUsed > expectedUsage + 15) {
        generatedInsights.push({
          id: "budget-warning",
          type: "warning",
          icon: "warning",
          title: t("insights.spendingAhead"),
          description: t("insights.spendingAheadDesc").replace("{percentage}", budgetUsed.toFixed(0)).replace("{days}", (daysInMonth - now.getDate()).toString()),
        });
      } else if (budgetUsed < expectedUsage - 10 && now.getDate() > 7) {
        generatedInsights.push({
          id: "budget-good",
          type: "success",
          icon: "checkmark-circle",
          title: t("insights.greatBudgetManagement"),
          description: t("insights.greatBudgetDesc").replace("{percentage}", (expectedUsage - budgetUsed).toFixed(0)),
        });
      }
    }

    // 2. Savings Analysis
    if (periodIncome > 0) {
      const savingsRate = (netSavings / periodIncome) * 100;
      
      if (savingsRate >= 30) {
        generatedInsights.push({
          id: "savings-excellent",
          type: "success",
          icon: "trophy",
          title: t("insights.excellentSavings"),
          description: t("insights.excellentSavingsDesc").replace("{percentage}", savingsRate.toFixed(0)),
          value: formatAmount(netSavings),
        });
      } else if (savingsRate >= 20) {
        generatedInsights.push({
          id: "savings-good",
          type: "success",
          icon: "thumbs-up",
          title: t("insights.goodSavingsRate"),
          description: t("insights.goodSavingsDesc").replace("{percentage}", savingsRate.toFixed(0)),
        });
      } else if (savingsRate >= 10) {
        generatedInsights.push({
          id: "savings-moderate",
          type: "warning",
          icon: "hand-left",
          title: t("insights.moderateSavings"),
          description: t("insights.moderateSavingsDesc").replace("{percentage}", savingsRate.toFixed(0)),
        });
      } else if (savingsRate > 0) {
        generatedInsights.push({
          id: "savings-low",
          type: "warning",
          icon: "alert",
          title: t("insights.lowSavingsAlert"),
          description: t("insights.lowSavingsDesc").replace("{percentage}", savingsRate.toFixed(0)),
        });
      } else if (netSavings < 0) {
        generatedInsights.push({
          id: "overspending",
          type: "danger",
          icon: "trending-down",
          title: t("insights.overspending"),
          description: t("insights.overspendingDesc").replace("{amount}", formatAmount(Math.abs(netSavings))),
        });
      }
    }

    // 3. Period-over-Period Comparison
    if (prevPeriodExpenses > 0 && periodExpenses > 0) {
      const changePercent = ((periodExpenses - prevPeriodExpenses) / prevPeriodExpenses) * 100;
      
      if (changePercent > 20) {
        generatedInsights.push({
          id: "spending-spike",
          type: "warning",
          icon: "arrow-up",
          title: t("insights.spendingSpike"),
          description: t("insights.spendingSpikeDesc").replace("{percentage}", changePercent.toFixed(0)),
        });
      } else if (changePercent < -15) {
        generatedInsights.push({
          id: "spending-decrease",
          type: "success",
          icon: "arrow-down",
          title: t("insights.spendingDecrease"),
          description: t("insights.spendingDecreaseDesc").replace("{percentage}", Math.abs(changePercent).toFixed(0)),
        });
      }
    }

    // 4. Top Spending Category Analysis
    const categoryTotals: { [key: string]: number } = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (Number(t.amount) || 0);
      });

    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a);

    if (sortedCategories.length > 0) {
      const [topCategory, topAmount] = sortedCategories[0];
      const topPercent = periodExpenses > 0 ? (topAmount / periodExpenses) * 100 : 0;
      
      if (topPercent > 40) {
        const translatedCategory = translateCategoryName(topCategory, t);
        generatedInsights.push({
          id: "top-category-high",
          type: "warning",
          icon: "pie-chart",
          title: t("insights.highCategorySpending").replace("{category}", translatedCategory),
          description: t("insights.highCategoryDesc")
            .replace("{category}", translatedCategory)
            .replace("{percentage}", topPercent.toFixed(0))
            .replace("{amount}", formatAmount(topAmount)),
        });
      } else {
        const translatedCategory = translateCategoryName(topCategory, t);
        generatedInsights.push({
          id: "top-category",
          type: "info",
          icon: "bar-chart",
          title: t("insights.topCategory").replace("{category}", translatedCategory),
          description: t("insights.topCategoryDesc")
            .replace("{category}", translatedCategory)
            .replace("{amount}", formatAmount(topAmount))
            .replace("{percentage}", topPercent.toFixed(0)),
        });
      }
    }

    // 5. Spending Pattern - Day Analysis
    const dayTotals: { [key: number]: number } = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const day = new Date(t.date).getDay();
        dayTotals[day] = (dayTotals[day] || 0) + (Number(t.amount) || 0);
      });

    const dayNames = [
      t("common.sunday"),
      t("common.monday"),
      t("common.tuesday"),
      t("common.wednesday"),
      t("common.thursday"),
      t("common.friday"),
      t("common.saturday"),
    ];
    const sortedDays = Object.entries(dayTotals).sort(([, a], [, b]) => b - a);
    
    if (sortedDays.length > 0) {
      const [highestDay, dayAmount] = sortedDays[0];
      const dayName = dayNames[Number(highestDay)];
      generatedInsights.push({
        id: "spending-day",
        type: "info",
        icon: "calendar",
        title: t("insights.expensiveDay").replace("{day}", dayName),
        description: t("insights.expensiveDayDesc").replace("{day}", dayName).replace("{amount}", formatAmount(dayAmount)),
      });
    }

    // 6. Daily Average Spending
    const dailyAverage = periodExpenses / daysPassed;
    generatedInsights.push({
      id: "daily-average",
      type: "info",
      icon: "calculator",
      title: "Daily Spending Average",
      description: `You're spending an average of ${formatAmount(dailyAverage)} per day during this period.`,
    });

    // 7. Recurring Expenses Analysis
    const totalRecurring = recurringExpenses
      .filter((r) => r.isActive)
      .reduce((sum, r) => {
        let monthlyAmount = Number(r.amount) || 0;
        switch (r.frequency) {
          case "daily": monthlyAmount *= 30; break;
          case "weekly": monthlyAmount *= 4; break;
          case "yearly": monthlyAmount /= 12; break;
        }
        return sum + monthlyAmount;
      }, 0);

    if (totalRecurring > 0) {
      const recurringPercent = periodIncome > 0 ? (totalRecurring / periodIncome) * 100 : 0;
      
      if (recurringPercent > 50) {
        generatedInsights.push({
          id: "recurring-high",
          type: "danger",
          icon: "repeat",
          title: t("insights.highFixedExpenses"),
          description: t("insights.highFixedDesc")
            .replace("{amount}", formatAmount(totalRecurring))
            .replace("{percentage}", recurringPercent.toFixed(0)),
        });
      } else if (recurringPercent > 30) {
        generatedInsights.push({
          id: "recurring-moderate",
          type: "warning",
          icon: "sync",
          title: t("insights.monitorRecurring"),
          description: t("insights.monitorRecurringDesc").replace("{amount}", formatAmount(totalRecurring)),
        });
      } else {
        generatedInsights.push({
          id: "recurring-good",
          type: "info",
          icon: "refresh",
          title: t("insights.recurringSummary"),
          description: t("insights.recurringSummaryDesc")
            .replace("{amount}", formatAmount(totalRecurring))
            .replace("{count}", recurringExpenses.filter(r => r.isActive).length.toString()),
        });
      }
    }

    // 8. Bill Reminders
    const upcomingBills = billReminders.filter((b) => {
      const dueDate = new Date(b.dueDate);
      const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return !b.isPaid && daysUntilDue >= 0 && daysUntilDue <= 7;
    });

    if (upcomingBills.length > 0) {
      const totalUpcoming = upcomingBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
      const titleKey = upcomingBills.length > 1 ? "insights.billsDueSoonPlural" : "insights.billsDueSoon";
      generatedInsights.push({
        id: "upcoming-bills",
        type: "warning",
        icon: "notifications",
        title: t(titleKey).replace("{count}", upcomingBills.length.toString()),
        description: t("insights.billsDueDesc").replace("{amount}", formatAmount(totalUpcoming)),
      });
    }

    const overdueBills = billReminders.filter((b) => {
      const dueDate = new Date(b.dueDate);
      return !b.isPaid && dueDate < now;
    });

    if (overdueBills.length > 0) {
      const totalOverdue = overdueBills.reduce((sum, b) => sum + (Number(b.amount) || 0), 0);
      const titleKey = overdueBills.length > 1 ? "insights.overdueBillsPlural" : "insights.overdueBills";
      generatedInsights.push({
        id: "overdue-bills",
        type: "danger",
        icon: "alert-circle",
        title: t(titleKey).replace("{count}", overdueBills.length.toString()),
        description: t("insights.overdueBillsDesc").replace("{amount}", formatAmount(totalOverdue)),
      });
    }

    // 9. Payment Mode Tips
    const paymentTotals: { [key: string]: number } = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        paymentTotals[t.paymentMode] = (paymentTotals[t.paymentMode] || 0) + (Number(t.amount) || 0);
      });

    if (paymentTotals.cash && periodExpenses > 0) {
      const cashPercent = (paymentTotals.cash / periodExpenses) * 100;
      if (cashPercent > 50) {
        generatedInsights.push({
          id: "cash-heavy",
          type: "tip",
          icon: "bulb",
          title: t("insights.considerDigitalPayments"),
          description: t("insights.digitalPaymentsDesc").replace("{percentage}", cashPercent.toFixed(0)),
        });
      }
    }

    // 10. Transaction Frequency
    if (filteredTransactions.length > 0) {
      const expenseCount = filteredTransactions.filter(t => t.type === "expense").length;
      const avgTransactionSize = expenseCount > 0 ? periodExpenses / expenseCount : 0;
      
      if (avgTransactionSize < 100 && filteredTransactions.length > 30) {
        generatedInsights.push({
          id: "small-transactions",
          type: "tip",
          icon: "information-circle",
          title: t("insights.manySmallPurchases"),
          description: t("insights.smallPurchasesDesc").replace("{amount}", formatAmount(avgTransactionSize)),
        });
      }
    }

    // 11. Financial Health Score Indicator
    let healthScore = 50;
    if (netSavings > 0) healthScore += 20;
    if (selectedPeriod === "month" && monthlyBudget > 0 && periodExpenses <= monthlyBudget) healthScore += 15;
    if (overdueBills.length === 0) healthScore += 10;
    if (totalRecurring < periodIncome * 0.3) healthScore += 5;

    let healthStatus: InsightType = "info";
    let healthMessage = "";
    
    if (healthScore >= 80) {
      healthStatus = "success";
      healthMessage = t("insights.healthExcellent");
    } else if (healthScore >= 60) {
      healthStatus = "info";
      healthMessage = t("insights.healthGood");
    } else if (healthScore >= 40) {
      healthStatus = "warning";
      healthMessage = t("insights.healthRoomForImprovement");
    } else {
      healthStatus = "danger";
      healthMessage = t("insights.healthNeedsAttention");
    }

    generatedInsights.unshift({
      id: "health-score",
      type: healthStatus,
      icon: "heart",
      title: t("insights.financialHealth").replace("{score}", healthScore.toString()),
      description: healthMessage,
    });

    // Add motivational tip if doing well
    if (generatedInsights.filter(i => i.type === "success").length >= 2) {
      generatedInsights.push({
        id: "motivation",
        type: "success",
        icon: "star",
        title: t("insights.doingGreat"),
        description: t("insights.doingGreatDesc"),
      });
    }

    return generatedInsights;
  }, [
    filteredTransactions,
    monthlyBudget,
    periodIncome,
    periodExpenses,
    prevPeriodExpenses,
    netSavings,
    recurringExpenses,
    billReminders,
    formatAmount,
    selectedPeriod,
    now,
  ]);

  const getTypeColor = (type: InsightType) => {
    switch (type) {
      case "success": return colors.success;
      case "warning": return colors.warning;
      case "danger": return colors.danger;
      case "info": return colors.primary;
      case "tip": return "#8B5CF6";
      default: return colors.muted;
    }
  };

  const getTypeBackground = (type: InsightType) => {
    switch (type) {
      case "success": return `${colors.success}15`;
      case "warning": return `${colors.warning}15`;
      case "danger": return `${colors.danger}15`;
      case "info": return `${colors.primary}15`;
      case "tip": return "#8B5CF615";
      default: return colors.card;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t("insights.title")} />
      
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

        {/* Summary Header */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.summaryRow}
          >
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t("insights.spent")}</Text>
              <Text style={[styles.summaryValue, { color: colors.danger }]} numberOfLines={1}>
                {formatAmount(periodExpenses)}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t("insights.income")}</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]} numberOfLines={1}>
                {formatAmount(periodIncome)}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t("insights.net")}</Text>
              <Text
                style={[
                  styles.summaryValue,
                  { color: netSavings >= 0 ? colors.success : colors.danger },
                ]}
                numberOfLines={1}
              >
                {formatAmount(Math.abs(netSavings))}
              </Text>
              <Text style={[styles.summarySubtext, { color: colors.muted }]}>
                {netSavings >= 0 ? t("insights.saved") : t("insights.deficit")}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t("insights.insights")}</Text>
              <Text style={[styles.summaryValue, { color: colors.primary }]} numberOfLines={1}>
                {insights.length}
              </Text>
            </View>
          </ScrollView>
        </View>

        {/* Insights List */}
        {insights.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Ionicons name="bulb" size={48} color={colors.muted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>{t("insights.noInsightsYet")}</Text>
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              {t("insights.noInsightsDescription")}
            </Text>
          </View>
        ) : (
          insights.map((insight) => (
            <View
              key={insight.id}
              style={[
                styles.insightCard,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                  borderLeftColor: getTypeColor(insight.type),
                },
              ]}
            >
              <View
                style={[
                  styles.insightIconContainer,
                  { backgroundColor: getTypeBackground(insight.type) },
                ]}
              >
                <Ionicons
                  name={insight.icon as any}
                  size={24}
                  color={getTypeColor(insight.type)}
                />
              </View>
              <View style={styles.insightContent}>
                <Text style={[styles.insightTitle, { color: colors.text }]}>
                  {insight.title}
                </Text>
                <Text style={[styles.insightDescription, { color: colors.muted }]}>
                  {insight.description}
                </Text>
                {insight.value && (
                  <Text
                    style={[
                      styles.insightValue,
                      { color: getTypeColor(insight.type) },
                    ]}
                  >
                    {insight.value}
                  </Text>
                )}
              </View>
            </View>
          ))
        )}

        {/* Tips Section */}
        <View style={[styles.tipsSection, { backgroundColor: `${colors.primary}10` }]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color={colors.primary} />
            <Text style={[styles.tipsTitle, { color: colors.primary }]}>{t("insights.quickTips")}</Text>
          </View>
          <View style={styles.tipsList}>
            <Text style={[styles.tipItem, { color: colors.text }]}>
              • {t("insights.tip1")}
            </Text>
            <Text style={[styles.tipItem, { color: colors.text }]}>
              • {t("insights.tip2")}
            </Text>
            <Text style={[styles.tipItem, { color: colors.text }]}>
              • {t("insights.tip3")}
            </Text>
            <Text style={[styles.tipItem, { color: colors.text }]}>
              • {t("insights.tip4")}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 0 },

  // Filter
  filterContainer: { gap: 8, paddingVertical: 16 },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterText: { fontSize: 14, fontWeight: "600" },

  // Summary Card
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryItem: {
    minWidth: 80,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  summaryDivider: {
    width: 1,
    height: 50,
    marginHorizontal: 8,
  },
  summaryLabel: { fontSize: 11, marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  summarySubtext: { fontSize: 10, marginTop: 2 },

  // Insight Card
  insightCard: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  insightValue: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 8,
  },

  // Empty State
  emptyCard: {
    padding: 40,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  // Tips Section
  tipsSection: {
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
  },
  tipsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  tipsList: {
    gap: 8,
  },
  tipItem: {
    fontSize: 14,
    lineHeight: 20,
  },
});
