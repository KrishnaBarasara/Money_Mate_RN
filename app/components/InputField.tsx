import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TextInputProps,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";

type InputFieldProps = TextInputProps & {
  label?: string;
  icon?: string;
  error?: string;
};

const InputField: React.FC<InputFieldProps> = ({
  label,
  icon,
  error,
  style,
  ...props
}) => {
  const { colors } = useThemeColors();

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.inputBackground,
            borderColor: error ? colors.danger : colors.inputBorder,
          },
        ]}
      >
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={colors.muted}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, { color: colors.text }, style]}
          placeholderTextColor={colors.muted}
          {...props}
        />
      </View>
      {error && <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    minHeight: 50,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
  },
  error: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default InputField;

