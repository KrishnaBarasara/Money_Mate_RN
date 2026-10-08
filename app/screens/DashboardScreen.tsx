import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { useTransactions } from "../context/TransactionContext";
import { useBudgets } from "../context/BudgetContext";
import { useLanguage } from "../context/LanguageContext";
import { MainStackParamList } from "../navigation/TabNavigator";
import StatCard from "../components/StatCard";
import TransactionItem from "../components/TransactionItem";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useThemeColors();
  const { formatAmount } = useCurrency();
  const { transactions, getTotalIncome, getTotalExpenses } = useTransactions();
  const { monthlyBudget } = useBudgets();
  const { t } = useLanguage();

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const totalIncome = getTotalIncome(currentMonth, currentYear);
  const totalExpenses = getTotalExpenses(currentMonth, currentYear);
  const balance = totalIncome - totalExpenses;
  const recentTransactions = transactions.slice(0, 5);

  // Today's spending
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todaySpent = transactions
    .filter((t) => {
      const transactionDate = new Date(t.date);
      return (
        t.type === "expense" &&
        transactionDate >= todayStart &&
        transactionDate <= now
      );
    })
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.muted }]}>
            {t("dashboard.title")}
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>{t("dashboard.title")}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ImageBackground
          source={require("../../assets/totalBalance_card.jpg")}
          style={styles.balanceCard}
          imageStyle={styles.balanceCardImage}
        >
          {/* Top Section */}
          <Text style={styles.balanceLabel}>{t("dashboard.currentBalance")}</Text>
          <Text
            style={styles.balanceAmount}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatAmount(balance)}
          </Text>

          {/* Bottom Glass Strip */}
          <View style={styles.bottomStrip}>
            <View style={styles.statItem}>
              <Ionicons name="arrow-up-circle" size={22} color="#34D399" />
              <Text style={styles.statLabel}>{t("dashboard.income")}</Text>
              <Text
                style={styles.statValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatAmount(totalIncome)}
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.statItem}>
              <Ionicons name="arrow-down-circle" size={22} color="#F87171" />
              <Text style={styles.statLabel}>{t("dashboard.expenses")}</Text>
              <Text
                style={styles.statValue}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatAmount(totalExpenses)}
              </Text>
            </View>
          </View>
        </ImageBackground>

        <View style={styles.statsRow}>
          <StatCard
            title={t("dashboard.budget")}
            value={formatAmount(monthlyBudget)}
            icon="pie-chart"
            iconColor={colors.primary}
          />
          <StatCard
            title={t("dashboard.remaining")}
            value={formatAmount(Math.max(0, monthlyBudget - totalExpenses))}
            icon="wallet"
            iconColor={
              monthlyBudget - totalExpenses >= 0
                ? colors.success
                : colors.danger
            }
          />
        </View>

        <View style={styles.statsRow}>
          <StatCard
            title={t("dashboard.todaySpent")}
            value={formatAmount(todaySpent)}
            icon="today"
            iconColor={colors.warning}
          />
          <StatCard
            title={t("dashboard.monthlySpent")}
            value={formatAmount(totalExpenses)}
            icon="calendar"
            iconColor={colors.danger}
          />
        </View>

        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t("dashboard.quickActions")}
          </Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AddTransaction", { type: "expense" })
              }
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Ionicons name="remove-circle" size={24} color={colors.danger} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {t("dashboard.expense")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AddTransaction", { type: "income" })
              }
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Ionicons name="add-circle" size={24} color={colors.success} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {t("dashboard.income")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("RecurringExpenses")}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Ionicons name="repeat" size={24} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {t("dashboard.recurring")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("BillReminders")}
              style={[
                styles.actionButton,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Ionicons name="notifications" size={24} color={colors.warning} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                {t("dashboard.bills")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {t("dashboard.recentTransactions")}
            </Text>
          </View>
          {recentTransactions.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
              <Ionicons name="receipt-outline" size={40} color={colors.muted} />
              <Text style={[styles.emptyText, { color: colors.muted }]}>
                {t("dashboard.noTransactions")}
              </Text>
            </View>
          ) : (
            recentTransactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  greeting: { fontSize: 14 },
  title: { fontSize: 28, fontWeight: "800" },
  content: { padding: 20, paddingTop: 0 },
  balanceRow: { flexDirection: "row", justifyContent: "space-between" },
  balanceItem: { alignItems: "center" },
  balanceItemLabel: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    marginTop: 4,
  },
  balanceItemValue: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  balanceCard: {
    height: 190,
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    justifyContent: "space-between",
    overflow: "hidden",
  },

  balanceCardImage: {
    borderRadius: 22,
  },

  balanceLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 14,
    fontWeight: "500",
  },

  balanceAmount: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* Bottom Strip */
  bottomStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.18)", // glass feel
  },

  statItem: {
    flex: 1,
    alignItems: "center",
  },

  statLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 12,
    marginTop: 6,
  },

  statValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },

  divider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
  },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  quickActions: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionButton: {
    width: "47%",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  actionText: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  recentSection: { marginBottom: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  seeAll: { fontSize: 14, fontWeight: "600" },
  emptyState: { padding: 40, borderRadius: 14, alignItems: "center" },
  emptyText: { fontSize: 14, marginTop: 12 },
});
