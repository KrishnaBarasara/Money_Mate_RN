import React, { createContext, useContext, useEffect, useState } from "react";
import { Transaction } from "../utils/types";
import { useAuth } from "./AuthContext";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { db } from "../services/firebase";

type TransactionContextType = {
  transactions: Transaction[];
  addTransaction: (data: Omit<Transaction, "id" | "userId" | "createdAt">) => Promise<void>;
  updateTransaction: (id: string, data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  getTransactionsByMonth: (month: number, year: number) => Transaction[];
  getTotalIncome: (month?: number, year?: number) => number;
  getTotalExpenses: (month?: number, year?: number) => number;
};

const TransactionContext = createContext<TransactionContextType>(
  {} as TransactionContextType
);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    if (!user) {
      setTransactions([]);
      return;
    }

    const q = query(
      collection(db, "transactions"),
      where("userId", "==", user.uid),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const transactionList: Transaction[] = [];
        snapshot.forEach((doc) => {
          transactionList.push({
            id: doc.id,
            ...doc.data(),
          } as Transaction);
        });
        setTransactions(transactionList);
      },
      (error) => {
        console.error("Error fetching transactions:", error);
        setTransactions([]);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addTransaction = async (
    data: Omit<Transaction, "id" | "userId" | "createdAt">
  ) => {
    if (!user) return;

    await addDoc(collection(db, "transactions"), {
      ...data,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    });
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    if (!user) return;

    const { id: _, userId: __, ...updateData } = data;
    await updateDoc(doc(db, "transactions", id), updateData);
  };

  const deleteTransaction = async (id: string) => {
    if (!user) return;

    await deleteDoc(doc(db, "transactions", id));
  };

  const getTransactionsByMonth = (month: number, year: number) => {
    return transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === month && date.getFullYear() === year;
    });
  };

  const getTotalIncome = (month?: number, year?: number) => {
    let filtered = transactions.filter((t) => t.type === "income");
    if (month !== undefined && year !== undefined) {
      filtered = filtered.filter((t) => {
        const date = new Date(t.date);
        return date.getMonth() === month && date.getFullYear() === year;
      });
    }
    return filtered.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  };

  const getTotalExpenses = (month?: number, year?: number) => {
    let filtered = transactions.filter((t) => t.type === "expense");
    if (month !== undefined && year !== undefined) {
      filtered = filtered.filter((t) => {
        const date = new Date(t.date);
        return date.getMonth() === month && date.getFullYear() === year;
      });
    }
    return filtered.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        getTransactionsByMonth,
        getTotalIncome,
        getTotalExpenses,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => useContext(TransactionContext);

