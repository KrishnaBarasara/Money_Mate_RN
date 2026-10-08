import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useLanguage } from "../context/LanguageContext";

import DashboardScreen from "../screens/DashboardScreen";
import TransactionsListScreen from "../screens/TransactionsListScreen";
import AddTransactionScreen from "../screens/AddTransactionScreen";
import BudgetScreen from "../screens/BudgetScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import RecurringExpensesScreen from "../screens/RecurringExpensesScreen";
import BillRemindersScreen from "../screens/BillRemindersScreen";
import ReportsScreen from "../screens/ReportsScreen";
import InsightsScreen from "../screens/InsightsScreen";
import ReceiptScanScreen from "../screens/ReceiptScanScreen";
import ExportScreen from "../screens/ExportScreen";
import LanguageSelectionScreen from "../screens/LanguageSelectionScreen";
import PINSetupScreen from "../screens/PINSetupScreen";
import PINVerifyScreen from "../screens/PINVerifyScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";

export type MainStackParamList = {
  Tabs: undefined;
  AddTransaction: { type?: "income" | "expense" } | undefined;
  Profile: undefined;
  RecurringExpenses: undefined;
  BillReminders: undefined;
  Reports: undefined;
  Insights: undefined;
  ReceiptScan: undefined;
  Export: undefined;
  LanguageSelection: undefined;
  PINSetup: { enableBiometricAfterSetup?: boolean } | undefined;
  PINVerify: {
    title?: string;
    subtitle?: string;
    onVerifySuccess?: () => void;
    showBackButton?: boolean;
  } | undefined;
  ChangePassword: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Budget: undefined;
  Settings: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

const getIconName = (routeName: string, focused: boolean): string => {
  switch (routeName) {
    case "Dashboard":
      return focused ? "home" : "home-outline";
    case "Transactions":
      return focused ? "list" : "list-outline";
    case "Budget":
      return focused ? "pie-chart" : "pie-chart-outline";
    case "Settings":
      return focused ? "settings" : "settings-outline";
    default:
      return "ellipse";
  }
};

function TabNavigator() {
  const { colors } = useThemeColors();
  const { t } = useLanguage();

  const getTabLabel = (routeName: string): string => {
    switch (routeName) {
      case "Dashboard":
        return t("navigation.dashboard");
      case "Transactions":
        return t("navigation.transactions");
      case "Budget":
        return t("navigation.budget");
      case "Settings":
        return t("navigation.settings");
      default:
        return routeName;
    }
  };

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarLabel: getTabLabel(route.name),
        tabBarIcon: ({ focused, color, size }) => {
          const iconName = getIconName(route.name, focused);
          return <Ionicons name={iconName as any} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          paddingTop: 8,
          height: 85,
          paddingBottom: 25,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginBottom: 5,
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Transactions" component={TransactionsListScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Tabs" component={TabNavigator} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen
        name="RecurringExpenses"
        component={RecurringExpensesScreen}
      />
      <Stack.Screen name="BillReminders" component={BillRemindersScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Insights" component={InsightsScreen} />
      <Stack.Screen name="ReceiptScan" component={ReceiptScanScreen} />
      <Stack.Screen name="Export" component={ExportScreen} />
      <Stack.Screen name="LanguageSelection" component={LanguageSelectionScreen} />
      <Stack.Screen 
        name="PINSetup" 
        component={PINSetupScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="PINVerify" 
        component={PINVerifyScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
