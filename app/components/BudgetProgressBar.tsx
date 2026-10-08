import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useThemeColors } from "../context/ThemeContext";

type BudgetProgressBarProps = {
  spent: number;
  limit: number;
  showLabels?: boolean;
  height?: number;
};

const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  spent,
  limit,
  showLabels = true,
  height = 8,
}) => {
  const { colors } = useThemeColors();

  const percentage = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;

  const getBarColor = () => {
    if (percentage >= 100) return colors.danger;
    if (percentage >= 80) return colors.warning;
    return colors.success;
  };

  return (
    <View style={styles.container}>
      {showLabels && (
        <View style={styles.labels}>
          <Text style={[styles.label, { color: colors.muted }]}>
            Spent: {percentage.toFixed(0)}%
          </Text>
          <Text style={[styles.label, { color: colors.muted }]}>
            {limit - spent > 0 ? `${(limit - spent).toFixed(0)} left` : "Over budget"}
          </Text>
        </View>
      )}
      <View
        style={[
          styles.track,
          { backgroundColor: colors.inputBackground, height },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              backgroundColor: getBarColor(),
              width: `${percentage}%`,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
  },
  track: {
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    borderRadius: 4,
  },
});

export default BudgetProgressBar;

