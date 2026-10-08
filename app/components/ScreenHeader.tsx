import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useThemeColors } from "../context/ThemeContext";

type ScreenHeaderProps = {
  title: string;
  showBack?: boolean;
  rightComponent?: React.ReactNode;
};

const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  showBack = true,
  rightComponent,
}) => {
  const navigation = useNavigation();
  const { colors } = useThemeColors();

  return (
    <View style={[styles.header, { backgroundColor: colors.background }]}>
      <View style={styles.leftContainer}>
        {showBack && (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>
        )}
      </View>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <View style={styles.rightContainer}>{rightComponent}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
  },
  leftContainer: {
    width: 40,
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  rightContainer: {
    width: 40,
    alignItems: "flex-end",
  },
});

export default ScreenHeader;
