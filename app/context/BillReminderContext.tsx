import React, { createContext, useContext, useEffect, useState } from "react";
import { BillReminder } from "../utils/types";
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
import * as Notifications from "expo-notifications";

type BillReminderContextType = {
  billReminders: BillReminder[];
  addBillReminder: (
    data: Omit<BillReminder, "id" | "userId" | "createdAt">
  ) => Promise<void>;
  updateBillReminder: (
    id: string,
    data: Partial<BillReminder>
  ) => Promise<void>;
  deleteBillReminder: (id: string) => Promise<void>;
  markAsPaid: (id: string) => Promise<void>;
};

const BillReminderContext = createContext<BillReminderContextType>(
  {} as BillReminderContextType
);

export const BillReminderProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const [billReminders, setBillReminders] = useState<BillReminder[]>([]);

  useEffect(() => {
    // Configure notification handler
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch (error) {
      console.warn("Failed to set notification handler:", error);
    }

    if (!user) {
      setBillReminders([]);
      return;
    }

    // Setup notification channel for Android
    const setupNotificationChannel = async () => {
      try {
        await Notifications.setNotificationChannelAsync("bill-reminders", {
          name: "Bill Reminders",
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#10B981",
          sound: "default",
          enableVibrate: true,
          enableLights: true,
          showBadge: true,
        });
        console.log("Notification channel created successfully");
      } catch (error) {
        console.warn("Failed to create notification channel:", error);
      }
    };

    // Request notification permissions
    const requestPermissions = async () => {
      try {
        const { status: existingStatus } =
          await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== "granted") {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }

        if (finalStatus !== "granted") {
          console.warn("Notification permissions not granted");
        } else {
          console.log("Notification permissions granted");
        }
      } catch (error) {
        console.warn("Failed to request notification permissions:", error);
      }
    };

    setupNotificationChannel();
    requestPermissions();

    const q = query(
      collection(db, "billReminders"),
      where("userId", "==", user.uid),
      where("isPaid", "==", false)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const reminderList: BillReminder[] = [];
        snapshot.forEach((docSnapshot) => {
          const data = docSnapshot.data();
          reminderList.push({
            id: docSnapshot.id,
            userId: data.userId,
            title: data.title,
            amount: data.amount,
            dueDate: data.dueDate,
            category: data.category,
            isPaid: data.isPaid,
            reminderDate: data.reminderDate,
            createdAt: data.createdAt,
          } as BillReminder);
        });
        setBillReminders(reminderList);
        scheduleNotifications(reminderList);
      },
      (error) => {
        console.error("Error fetching bill reminders:", error);
        setBillReminders([]);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const scheduleNotifications = async (reminders: BillReminder[]) => {
    try {
      // Cancel all existing notifications first
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("Cancelled all existing notifications");

      let scheduledCount = 0;
      const now = new Date();
      console.log(`Current time: ${now.toISOString()}`);

      // Schedule new notifications
      for (const reminder of reminders) {
        // Schedule reminder notification
        if (reminder.reminderDate) {
          const reminderDateTime = new Date(reminder.reminderDate);
          console.log(
            `Reminder "${
              reminder.title
            }" - reminderDate: ${reminderDateTime.toISOString()}`
          );

          if (reminderDateTime > now) {
            try {
              // Use date trigger for absolute scheduling (more reliable)
              const notificationId =
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: "💰 Bill Reminder",
                    body: `${reminder.title} - ₹${reminder.amount} is due soon!`,
                    data: { reminderId: reminder.id },
                    sound: "default",
                  },
                  trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: reminderDateTime,
                    channelId: "bill-reminders",
                  },
                });
              const minutesUntil = Math.round(
                (reminderDateTime.getTime() - now.getTime()) / 60000
              );
              console.log(
                `✓ Scheduled reminder: ${notificationId} at ${reminderDateTime.toLocaleString()} (in ${minutesUntil} minutes) for "${
                  reminder.title
                }"`
              );
              scheduledCount++;
            } catch (err) {
              console.error(
                `Failed to schedule reminder for "${reminder.title}":`,
                err
              );
            }
          } else {
            console.log(
              `✗ Skipped reminder for "${reminder.title}" - date is in the past`
            );
          }
        }

        // Schedule due date notification (at 9 AM on due date)
        const dueDateTime = new Date(reminder.dueDate);
        dueDateTime.setHours(9, 0, 0, 0);

        if (dueDateTime > now) {
          try {
            const notificationId =
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "📅 Bill Due Today",
                  body: `${reminder.title} - ₹${reminder.amount} is due today!`,
                  data: { reminderId: reminder.id },
                  sound: "default",
                },
                trigger: {
                  type: Notifications.SchedulableTriggerInputTypes.DATE,
                  date: dueDateTime,
                  channelId: "bill-reminders",
                },
              });
            const minutesUntil = Math.round(
              (dueDateTime.getTime() - now.getTime()) / 60000
            );
            console.log(
              `✓ Scheduled due date: ${notificationId} at ${dueDateTime.toLocaleString()} (in ${minutesUntil} minutes) for "${
                reminder.title
              }"`
            );
            scheduledCount++;
          } catch (err) {
            console.error(
              `Failed to schedule due date for "${reminder.title}":`,
              err
            );
          }
        } else {
          console.log(
            `✗ Skipped due date for "${reminder.title}" - date is in the past`
          );
        }
      }

      console.log(`=== Total notifications scheduled: ${scheduledCount} ===`);

      // Log all scheduled notifications for verification
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log(
        `Scheduled notifications list (${scheduled.length}):`,
        scheduled.map((n) => ({
          id: n.identifier,
          title: n.content.title,
          trigger: n.trigger,
        }))
      );
    } catch (error) {
      console.error("Failed to schedule notifications:", error);
    }
  };

  const addBillReminder = async (
    data: Omit<BillReminder, "id" | "userId" | "createdAt">
  ) => {
    if (!user) return;

    await addDoc(collection(db, "billReminders"), {
      ...data,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    });
  };

  const updateBillReminder = async (
    id: string,
    data: Partial<BillReminder>
  ) => {
    if (!user) return;

    const { id: _, userId: __, ...updateData } = data;
    await updateDoc(doc(db, "billReminders", id), updateData);
  };

  const deleteBillReminder = async (id: string) => {
    if (!user) return;

    await deleteDoc(doc(db, "billReminders", id));
  };

  const markAsPaid = async (id: string) => {
    await updateBillReminder(id, { isPaid: true });
  };

  return (
    <BillReminderContext.Provider
      value={{
        billReminders,
        addBillReminder,
        updateBillReminder,
        deleteBillReminder,
        markAsPaid,
      }}
    >
      {children}
    </BillReminderContext.Provider>
  );
};

export const useBillReminders = () => useContext(BillReminderContext);

