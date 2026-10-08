import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CURRENCIES } from "../utils/constants";

type CurrencyContextType = {
  currency: string;
  currencySymbol: string;
  setCurrency: (code: string) => void;
  formatAmount: (amount: number) => string;
};

const CurrencyContext = createContext<CurrencyContextType>(
  {} as CurrencyContextType
);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currency, setCurrencyState] = useState("INR");

  useEffect(() => {
    AsyncStorage.getItem("currency").then((saved) => {
      if (saved) {
        setCurrencyState(saved);
      }
    });
  }, []);

  const setCurrency = async (code: string) => {
    setCurrencyState(code);
    await AsyncStorage.setItem("currency", code);
  };

  const currencyData = CURRENCIES.find((c) => c.code === currency);
  const currencySymbol = currencyData?.symbol || "₹";

  const formatAmount = (amount: number) => {
    // Handle undefined, null, or NaN values
    const safeAmount = typeof amount === "number" && !isNaN(amount) ? amount : 0;
    return `${currencySymbol}${safeAmount.toLocaleString("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <CurrencyContext.Provider
      value={{ currency, currencySymbol, setCurrency, formatAmount }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);

