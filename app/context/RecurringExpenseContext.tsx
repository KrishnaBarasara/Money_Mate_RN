import React, { createContext, useContext, useEffect, useState } from "react";
import { RecurringExpense } from "../utils/types";
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
} from "firebase/firestore";
import { db } from "../services/firebase";

type RecurringExpenseContextType = {
  recurringExpenses: RecurringExpense[];
  addRecurringExpense: (
    data: Omit<RecurringExpense, "id" | "userId" | "createdAt">
  ) => Promise<void>;
  updateRecurringExpense: (
    id: string,
    data: Partial<RecurringExpense>
  ) => Promise<void>;
  deleteRecurringExpense: (id: string) => Promise<void>;
};

const RecurringExpenseContext = createContext<RecurringExpenseContextType>(
  {} as RecurringExpenseContextType
);

export const RecurringExpenseProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { user } = useAuth();
  const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>(
    []
  );

  useEffect(() => {
    if (!user) {
      setRecurringExpenses([]);
      return;
    }

    const q = query(
      collection(db, "recurringExpenses"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const expenseList: RecurringExpense[] = [];
        snapshot.forEach((doc) => {
          expenseList.push({
            id: doc.id,
            ...doc.data(),
          } as RecurringExpense);
        });
        setRecurringExpenses(expenseList);
      },
      (error) => {
        console.error("Error fetching recurring expenses:", error);
        setRecurringExpenses([]);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const addRecurringExpense = async (
    data: Omit<RecurringExpense, "id" | "userId" | "createdAt">
  ) => {
    if (!user) return;

    await addDoc(collection(db, "recurringExpenses"), {
      ...data,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    });
  };

  const updateRecurringExpense = async (
    id: string,
    data: Partial<RecurringExpense>
  ) => {
    if (!user) return;

    const { id: _, userId: __, ...updateData } = data;
    await updateDoc(doc(db, "recurringExpenses", id), updateData);
  };

  const deleteRecurringExpense = async (id: string) => {
    if (!user) return;

    await deleteDoc(doc(db, "recurringExpenses", id));
  };

  return (
    <RecurringExpenseContext.Provider
      value={{
        recurringExpenses,
        addRecurringExpense,
        updateRecurringExpense,
        deleteRecurringExpense,
      }}
    >
      {children}
    </RecurringExpenseContext.Provider>
  );
};

export const useRecurringExpenses = () => useContext(RecurringExpenseContext);

