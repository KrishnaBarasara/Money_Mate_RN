import React, { createContext, useContext, useEffect, useState } from "react";
import { Budget } from "../utils/types";
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
  getDocs,
} from "firebase/firestore";
import { db } from "../services/firebase";

type BudgetContextType = {
  budgets: Budget[];
  monthlyBudget: number;
  setMonthlyBudget: (amount: number) => Promise<void>;
  addBudget: (data: Omit<Budget, "id" | "userId" | "createdAt">) => Promise<void>;
  updateBudget: (id: string, data: Partial<Budget>) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;
  getBudgetForCategory: (category: string, month: string) => Budget | undefined;
};

const BudgetContext = createContext<BudgetContextType>({} as BudgetContextType);

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [monthlyBudget, setMonthlyBudgetState] = useState(0);

  useEffect(() => {
    if (!user) {
      setBudgets([]);
      setMonthlyBudgetState(0);
      return;
    }

    const q = query(
      collection(db, "budgets"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const budgetList: Budget[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          budgetList.push({
            id: doc.id,
            ...data,
          } as Budget);
          
          // Check for monthly budget (category === "monthly")
          if (data.category === "monthly") {
            setMonthlyBudgetState(data.limit || 0);
          }
        });
        setBudgets(budgetList);
      },
      (error) => {
        console.error("Error fetching budgets:", error);
        setBudgets([]);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const setMonthlyBudget = async (amount: number) => {
    if (!user) return;

    const currentMonth = new Date().toISOString().slice(0, 7);
    
    // Check if monthly budget exists
    const existingBudget = budgets.find(
      (b) => b.category === "monthly" && b.month === currentMonth
    );

    if (existingBudget) {
      await updateDoc(doc(db, "budgets", existingBudget.id), {
        limit: amount,
      });
    } else {
      await addDoc(collection(db, "budgets"), {
        userId: user.uid,
        category: "monthly",
        limit: amount,
        spent: 0,
        month: currentMonth,
        createdAt: new Date().toISOString(),
      });
    }

    setMonthlyBudgetState(amount);
  };

  const addBudget = async (data: Omit<Budget, "id" | "userId" | "createdAt">) => {
    if (!user) return;

    await addDoc(collection(db, "budgets"), {
      ...data,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    });
  };

  const updateBudget = async (id: string, data: Partial<Budget>) => {
    if (!user) return;

    const { id: _, userId: __, ...updateData } = data;
    await updateDoc(doc(db, "budgets", id), updateData);
  };

  const deleteBudget = async (id: string) => {
    if (!user) return;

    await deleteDoc(doc(db, "budgets", id));
  };

  const getBudgetForCategory = (category: string, month: string) => {
    return budgets.find((b) => b.category === category && b.month === month);
  };

  return (
    <BudgetContext.Provider
      value={{
        budgets,
        monthlyBudget,
        setMonthlyBudget,
        addBudget,
        updateBudget,
        deleteBudget,
        getBudgetForCategory,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudgets = () => useContext(BudgetContext);

