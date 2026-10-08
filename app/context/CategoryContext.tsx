import React, { createContext, useContext, useEffect, useState } from "react";
import { Category } from "../utils/types";
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
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "../utils/constants";

type CategoryContextType = {
  categories: Category[];
  expenseCategories: Category[];
  incomeCategories: Category[];
  addCategory: (
    data: Omit<Category, "id" | "userId" | "createdAt">
  ) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getCategoryByName: (name: string) => Category | undefined;
  loading: boolean;
};

const CategoryContext = createContext<CategoryContextType>(
  {} as CategoryContextType
);

export const CategoryProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Initialize default categories for new users
  const initializeDefaultCategories = async (userId: string) => {
    try {
      // Check if user already has categories
      const q = query(
        collection(db, "categories"),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Add default expense categories
        for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
          await addDoc(collection(db, "categories"), {
            ...cat,
            type: "expense",
            userId: userId,
            createdAt: new Date().toISOString(),
          });
        }

        // Add default income categories
        for (const cat of DEFAULT_INCOME_CATEGORIES) {
          await addDoc(collection(db, "categories"), {
            ...cat,
            type: "income",
            userId: userId,
            createdAt: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error initializing default categories:", error);
    }
  };

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setLoading(false);
      setInitialized(false);
      return;
    }

    // Initialize default categories for new users
    if (!initialized) {
      initializeDefaultCategories(user.uid).then(() => {
        setInitialized(true);
      });
    }

    const q = query(
      collection(db, "categories"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const categoryList: Category[] = [];
        snapshot.forEach((doc) => {
          categoryList.push({
            id: doc.id,
            ...doc.data(),
          } as Category);
        });
        setCategories(categoryList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching categories:", error);
        setCategories([]);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, initialized]);

  const expenseCategories = categories.filter(
    (c) => c.type === "expense" || c.type === "both"
  );

  const incomeCategories = categories.filter(
    (c) => c.type === "income" || c.type === "both"
  );

  const addCategory = async (
    data: Omit<Category, "id" | "userId" | "createdAt">
  ) => {
    if (!user) return;

    await addDoc(collection(db, "categories"), {
      ...data,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    });
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    if (!user) return;

    const { id: _, userId: __, ...updateData } = data;
    await updateDoc(doc(db, "categories", id), updateData);
  };

  const deleteCategory = async (id: string) => {
    if (!user) return;

    await deleteDoc(doc(db, "categories", id));
  };

  const getCategoryByName = (name: string) => {
    return categories.find((c) => c.name === name);
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        expenseCategories,
        incomeCategories,
        addCategory,
        updateCategory,
        deleteCategory,
        getCategoryByName,
        loading,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => useContext(CategoryContext);
