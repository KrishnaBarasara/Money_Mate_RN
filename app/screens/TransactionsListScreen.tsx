import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { useTransactions } from "../context/TransactionContext";
import { useLanguage } from "../context/LanguageContext";
import { MainStackParamList } from "../navigation/TabNavigator";
import TransactionItem from "../components/TransactionItem";
import EmptyState from "../components/EmptyState";

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;
type TypeFilter = "all" | "income" | "expense";
type DateFilter = "all" | "today" | "yesterday" | "week" | "month" | "lastMonth" | "year" | "custom";

export default function TransactionsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useThemeColors();
  const { formatAmount } = useCurrency();
  const { transactions } = useTransactions();
  const { t } = useLanguage();

  const DATE_FILTERS: { key: DateFilter; label: string; icon: string }[] = [
    { key: "all", label: t("transactions.allTime"), icon: "infinite" },
    { key: "today", label: t("transactions.today"), icon: "today" },
    { key: "yesterday", label: t("transactions.yesterday"), icon: "arrow-back" },
    { key: "week", label: t("transactions.thisWeek"), icon: "calendar" },
    { key: "month", label: t("transactions.thisMonth"), icon: "calendar-outline" },
    { key: "lastMonth", label: t("transactions.lastMonth"), icon: "time" },
    { key: "year", label: t("transactions.thisYear"), icon: "calendar-number" },
    { key: "custom", label: t("transactions.custom"), icon: "options" },
  ];

  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [showDateFilterModal, setShowDateFilterModal] = useState(false);

  // Custom date range state
  const [customStartDate, setCustomStartDate] = useState(new Date());
  const [customEndDate, setCustomEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Get date range based on filter
  const getDateRange = (filter: DateFilter): { start: Date; end: Date } | null => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filter) {
      case "all":
        return null;
      case "today":
        return {
          start: today,
          end: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case "yesterday":
        const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        return {
          start: yesterday,
          end: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
        };
      case "week":
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return { start: weekStart, end: now };
      case "month":
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: now,
        };
      case "lastMonth":
        return {
          start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
          end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
        };
      case "year":
        return {
          start: new Date(now.getFullYear(), 0, 1),
          end: now,
        };
      case "custom":
        return {
          start: new Date(customStartDate.setHours(0, 0, 0, 0)),
          end: new Date(customEndDate.setHours(23, 59, 59, 999)),
        };
      default:
        return null;
    }
  };

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    let result = transactions;

    // Type filter
    if (typeFilter !== "all") {
      result = result.filter((t) => t.type === typeFilter);
    }

    // Date filter
    const dateRange = getDateRange(dateFilter);
    if (dateRange) {
      result = result.filter((t) => {
        const transactionDate = new Date(t.date);
        return transactionDate >= dateRange.start && transactionDate <= dateRange.end;
      });
    }

    return result;
  }, [transactions, typeFilter, dateFilter, customStartDate, customEndDate]);

  // Calculate summary
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const expense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    return { income, expense, net: income - expense, count: filteredTransactions.length };
  }, [filteredTransactions]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getActiveDateLabel = () => {
    if (dateFilter === "custom") {
      return `${formatDate(customStartDate)} - ${formatDate(customEndDate)}`;
    }
    return DATE_FILTERS.find((f) => f.key === dateFilter)?.label || t("transactions.allTime");
  };

  const handleDateFilterSelect = (filter: DateFilter) => {
    if (filter === "custom") {
      setDateFilter(filter);
      // Keep modal open for custom date selection
    } else {
      setDateFilter(filter);
      setShowDateFilterModal(false);
    }
  };

  const handleCustomDateApply = () => {
    setShowDateFilterModal(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>{t("transactions.title")}</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("AddTransaction")}
          style={[styles.addButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Type Filter */}
      <View style={styles.filterRow}>
        {(["all", "income", "expense"] as TypeFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setTypeFilter(f)}
            style={[
              styles.typeFilterButton,
              {
                backgroundColor: typeFilter === f ? colors.primary : colors.card,
                borderColor: typeFilter === f ? colors.primary : colors.cardBorder,
              },
            ]}
          >
            <Ionicons
              name={f === "all" ? "layers" : f === "income" ? "arrow-up" : "arrow-down"}
              size={16}
              color={typeFilter === f ? "#fff" : colors.text}
            />
            <Text
              style={[
                styles.typeFilterText,
                { color: typeFilter === f ? "#fff" : colors.text },
              ]}
            >
              {f === "all" ? t("common.all") : t(`transactions.${f}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Date Filter Button */}
      <TouchableOpacity
        onPress={() => setShowDateFilterModal(true)}
        style={[
          styles.dateFilterButton,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.dateFilterLeft}>
          <Ionicons name="calendar" size={20} color={colors.primary} />
          <Text style={[styles.dateFilterLabel, { color: colors.muted }]}>{t("transactions.period")}:</Text>
          <Text style={[styles.dateFilterValue, { color: colors.text }]} numberOfLines={1}>
            {getActiveDateLabel()}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color={colors.muted} />
      </TouchableOpacity>

      {/* Summary Card */}
      <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
        <View style={styles.summaryItem}>
          <Ionicons name="arrow-up-circle" size={20} color={colors.success} />
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t("transactions.income")}</Text>
          <Text style={[styles.summaryValue, { color: colors.success }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(summary.income)}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.summaryItem}>
          <Ionicons name="arrow-down-circle" size={20} color={colors.danger} />
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t("transactions.expense")}</Text>
          <Text style={[styles.summaryValue, { color: colors.danger }]} numberOfLines={1} adjustsFontSizeToFit>
            {formatAmount(summary.expense)}
          </Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.cardBorder }]} />
        <View style={styles.summaryItem}>
          <Ionicons name="stats-chart" size={20} color={colors.primary} />
          <Text style={[styles.summaryLabel, { color: colors.muted }]}>{t("transactions.net")}</Text>
          <Text
            style={[styles.summaryValue, { color: summary.net >= 0 ? colors.success : colors.danger }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatAmount(summary.net)}
          </Text>
        </View>
      </View>

      {/* Transaction Count */}
      <Text style={[styles.transactionCount, { color: colors.muted }]}>
        {summary.count} {summary.count === 1 ? t("transactions.transactionsFound") : t("transactions.transactionsFoundPlural")}
      </Text>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <EmptyState
          icon="receipt-outline"
          title={t("transactions.noTransactionsTitle")}
          description={
            dateFilter === "all" && typeFilter === "all"
              ? t("transactions.noTransactionsDescription")
              : t("transactions.noTransactionsMatchFilters")
          }
        />
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Date Filter Modal */}
      <Modal
        visible={showDateFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{t("transactions.selectDateRange")}</Text>
              <TouchableOpacity onPress={() => setShowDateFilterModal(false)}>
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.filterList}
              contentContainerStyle={styles.filterListContent}
            >
              {DATE_FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.key}
                  onPress={() => handleDateFilterSelect(filter.key)}
                  style={[
                    styles.filterOption,
                    {
                      backgroundColor: dateFilter === filter.key ? `${colors.primary}15` : "transparent",
                      borderColor: dateFilter === filter.key ? colors.primary : colors.cardBorder,
                    },
                  ]}
                >
                  <View style={[styles.filterIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                    <Ionicons name={filter.icon as any} size={20} color={colors.primary} />
                  </View>
                  <Text
                    style={[
                      styles.filterOptionText,
                      { color: dateFilter === filter.key ? colors.primary : colors.text },
                    ]}
                  >
                    {filter.label}
                  </Text>
                  {dateFilter === filter.key && (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Custom Date Range Section */}
            {dateFilter === "custom" && (
              <View style={[styles.customDateSection, { borderTopColor: colors.cardBorder }]}>
                <Text style={[styles.customDateTitle, { color: colors.text }]}>{t("transactions.customRange")}</Text>
                
                <View style={styles.datePickerRow}>
                  <TouchableOpacity
                    onPress={() => setShowStartDatePicker(true)}
                    style={[styles.datePickerButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                  >
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    <View>
                      <Text style={[styles.datePickerLabel, { color: colors.muted }]}>{t("transactions.from")}</Text>
                      <Text style={[styles.datePickerValue, { color: colors.text }]}>
                        {formatDate(customStartDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <Ionicons name="arrow-forward" size={20} color={colors.muted} />

                  <TouchableOpacity
                    onPress={() => setShowEndDatePicker(true)}
                    style={[styles.datePickerButton, { backgroundColor: colors.inputBackground, borderColor: colors.inputBorder }]}
                  >
                    <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                    <View>
                      <Text style={[styles.datePickerLabel, { color: colors.muted }]}>{t("transactions.to")}</Text>
                      <Text style={[styles.datePickerValue, { color: colors.text }]}>
                        {formatDate(customEndDate)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={handleCustomDateApply}
                  style={[styles.applyButton, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.applyButtonText}>{t("transactions.applyCustomRange")}</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Pickers */}
      {Platform.OS === "android" && showStartDatePicker && (
        <DateTimePicker
          value={customStartDate}
          mode="date"
          display="default"
          maximumDate={customEndDate}
          onChange={(event, date) => {
            setShowStartDatePicker(false);
            if (date) setCustomStartDate(date);
          }}
        />
      )}

      {Platform.OS === "android" && showEndDatePicker && (
        <DateTimePicker
          value={customEndDate}
          mode="date"
          display="default"
          minimumDate={customStartDate}
          maximumDate={new Date()}
          onChange={(event, date) => {
            setShowEndDatePicker(false);
            if (date) setCustomEndDate(date);
          }}
        />
      )}

      {Platform.OS === "ios" && showStartDatePicker && (
        <Modal
          visible={showStartDatePicker}
          transparent
          animationType="slide"
          statusBarTranslucent
        >
          <View style={styles.iosPickerOverlay}>
            <View style={[styles.iosPickerContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.iosPickerTitle, { color: colors.text }]}>{t("transactions.selectStartDate")}</Text>
              <DateTimePicker
                value={customStartDate}
                mode="date"
                display="spinner"
                maximumDate={customEndDate}
                textColor={colors.text}
                onChange={(event, date) => date && setCustomStartDate(date)}
              />
              <TouchableOpacity
                onPress={() => setShowStartDatePicker(false)}
                style={[styles.iosPickerDone, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.iosPickerDoneText}>{t("transactions.done")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "ios" && showEndDatePicker && (
        <Modal
          visible={showEndDatePicker}
          transparent
          animationType="slide"
          statusBarTranslucent
        >
          <View style={styles.iosPickerOverlay}>
            <View style={[styles.iosPickerContent, { backgroundColor: colors.card }]}>
              <Text style={[styles.iosPickerTitle, { color: colors.text }]}>{t("transactions.selectEndDate")}</Text>
              <DateTimePicker
                value={customEndDate}
                mode="date"
                display="spinner"
                minimumDate={customStartDate}
                maximumDate={new Date()}
                textColor={colors.text}
                onChange={(event, date) => date && setCustomEndDate(date)}
              />
              <TouchableOpacity
                onPress={() => setShowEndDatePicker(false)}
                style={[styles.iosPickerDone, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.iosPickerDoneText}>{t("transactions.done")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
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
  title: { fontSize: 28, fontWeight: "800" },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },

  // Type Filter
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 10,
  },
  typeFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  typeFilterText: { fontSize: 14, fontWeight: "600" },

  // Date Filter Button
  dateFilterButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  dateFilterLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
  },
  dateFilterLabel: { fontSize: 13 },
  dateFilterValue: { fontSize: 14, fontWeight: "600", flex: 1 },

  // Summary Card
  summaryCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: "100%",
    marginHorizontal: 8,
  },
  summaryLabel: { fontSize: 11, marginTop: 4 },
  summaryValue: { fontSize: 14, fontWeight: "700", marginTop: 2 },

  transactionCount: {
    fontSize: 13,
    paddingHorizontal: 20,
    marginBottom: 8,
  },

  list: { paddingHorizontal: 20, paddingBottom: 100 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "80%",
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  filterList: {
    padding: 16,
  },
  filterListContent: {
    paddingBottom: 40,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  filterIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  filterOptionText: { fontSize: 15, fontWeight: "600", flex: 1 },

  // Custom Date Section
  customDateSection: {
    padding: 20,
    borderTopWidth: 1,
  },
  customDateTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 16,
  },
  datePickerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  datePickerButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
  },
  datePickerLabel: { fontSize: 11 },
  datePickerValue: { fontSize: 13, fontWeight: "600" },
  applyButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  // iOS Picker Modal
  iosPickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  iosPickerContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  iosPickerDone: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  iosPickerDoneText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
