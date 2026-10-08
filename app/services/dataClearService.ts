import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";

type ClearResult = {
  success: boolean;
  error?: string;
  deletedCounts?: {
    transactions: number;
    categories: number;
    recurringExpenses: number;
    billReminders: number;
    budgets: number;
  };
};

export const clearAllUserData = async (userId: string): Promise<ClearResult> => {
  try {
    const collections = [
      "transactions",
      "categories",
      "recurringExpenses",
      "billReminders",
      "budgets",
    ];

    const deletedCounts: any = {};

    for (const collectionName of collections) {
      const q = query(
        collection(db, collectionName),
        where("userId", "==", userId)
      );
      const snapshot = await getDocs(q);

      let count = 0;
      const batch = writeBatch(db);

      snapshot.docs.forEach((docSnapshot) => {
        batch.delete(doc(db, collectionName, docSnapshot.id));
        count++;
      });

      if (count > 0) {
        await batch.commit();
      }

      deletedCounts[collectionName] = count;
    }

    return {
      success: true,
      deletedCounts: {
        transactions: deletedCounts.transactions || 0,
        categories: deletedCounts.categories || 0,
        recurringExpenses: deletedCounts.recurringExpenses || 0,
        billReminders: deletedCounts.billReminders || 0,
        budgets: deletedCounts.budgets || 0,
      },
    };
  } catch (error: any) {
    console.error("Error clearing user data:", error);
    return {
      success: false,
      error: error.message || "Failed to clear user data",
    };
  }
};

export const clearSpecificData = async (
  userId: string,
  collectionName: string
): Promise<{ success: boolean; count: number; error?: string }> => {
  try {
    const q = query(
      collection(db, collectionName),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((docSnapshot) => {
      batch.delete(doc(db, collectionName, docSnapshot.id));
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }

    return { success: true, count };
  } catch (error: any) {
    console.error(`Error clearing ${collectionName}:`, error);
    return {
      success: false,
      count: 0,
      error: error.message || `Failed to clear ${collectionName}`,
    };
  }
};

