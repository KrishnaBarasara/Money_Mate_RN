import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";

type StatCardProps = {
  title: string;
  value: string;
  icon: string;
  iconColor?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  iconColor,
  trend,
  trendValue,
}) => {
  const { colors } = useThemeColors();

  const getTrendColor = () => {
    if (trend === "up") return colors.success;
    if (trend === "down") return colors.danger;
    return colors.muted;
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${iconColor || colors.primary}15` },
          ]}
        >
          <Ionicons
            name={icon as any}
            size={20}
            color={iconColor || colors.primary}
          />
        </View>
        {trend && trendValue && (
          <View style={styles.trendContainer}>
            <Ionicons
              name={trend === "up" ? "trending-up" : "trending-down"}
              size={14}
              color={getTrendColor()}
            />
            <Text style={[styles.trendText, { color: getTrendColor() }]}>
              {trendValue}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.value, { color: colors.text }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.title, { color: colors.muted }]}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: "600",
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  title: {
    fontSize: 13,
  },
});

export default StatCard;

