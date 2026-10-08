import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { useCategories } from "../context/CategoryContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCategoryName } from "../utils/categoryTranslations";
import { Transaction } from "../utils/types";

type TransactionItemProps = {
  transaction: Transaction;
  onPress?: () => void;
};

const paymentIcons: { [key: string]: string } = {
  cash: "cash",
  upi: "phone-portrait",
  card: "card",
  bank: "business",
};

const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onPress,
}) => {
  const { colors } = useThemeColors();
  const { formatAmount } = useCurrency();
  const { getCategoryByName } = useCategories();
  const { t } = useLanguage();

  const category = getCategoryByName(transaction.category);
  const isExpense = transaction.type === "expense";

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: `${category?.color || colors.primary}15` },
        ]}
      >
        <Ionicons
          name={(category?.icon || "ellipse") as any}
          size={24}
          color={category?.color || colors.primary}
        />
      </View>
      <View style={styles.details}>
        <Text style={[styles.category, { color: colors.text }]}>
          {translateCategoryName(transaction.category, t)}
        </Text>
        <View style={styles.metaRow}>
          <Text style={[styles.description, { color: colors.muted }]}>
            {transaction.description || "No description"}
          </Text>
          <View style={styles.paymentBadge}>
            <Ionicons
              name={paymentIcons[transaction.paymentMode] as any}
              size={12}
              color={colors.muted}
            />
          </View>
        </View>
      </View>
      <View style={styles.amountContainer}>
        <Text
          style={[
            styles.amount,
            { color: isExpense ? colors.danger : colors.success },
          ]}
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          {isExpense ? "-" : "+"}
          {formatAmount(transaction.amount)}
        </Text>
        <Text style={[styles.date, { color: colors.muted }]}>
          {formatDate(transaction.date)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  details: {
    flex: 1,
  },
  category: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  description: {
    fontSize: 13,
    flex: 1,
  },
  paymentBadge: {
    padding: 4,
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
  },
});

export default TransactionItem;
