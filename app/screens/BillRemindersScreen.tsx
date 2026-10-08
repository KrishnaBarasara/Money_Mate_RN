import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { useBillReminders } from "../context/BillReminderContext";
import { useCategories } from "../context/CategoryContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { Category } from "../utils/types";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "../utils/constants";
import { translateCategoryName } from "../utils/categoryTranslations";
import ScreenHeader from "../components/ScreenHeader";
import ModalWrapper from "../components/ModalWrapper";
import EmptyState from "../components/EmptyState";

export default function BillRemindersScreen() {
  const { colors } = useThemeColors();
  const { formatAmount } = useCurrency();
  const {
    billReminders,
    addBillReminder,
    updateBillReminder,
    deleteBillReminder,
    markAsPaid,
  } = useBillReminders();
  const { expenseCategories, addCategory, updateCategory, deleteCategory } =
    useCategories();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Bill form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBill, setEditingBill] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [dueDate, setDueDate] = useState(new Date());
  const [reminderDate, setReminderDate] = useState<Date | null>(null);
  const [showDueDatePicker, setShowDueDatePicker] = useState(false);
  const [showReminderDatePicker, setShowReminderDatePicker] = useState(false);
  const [showReminderTimePicker, setShowReminderTimePicker] = useState(false);

  // Category management state
  const [showCreateCategoryModal, setShowCreateCategoryModal] = useState(false);
  const [showManageCategoriesModal, setShowManageCategoriesModal] =
    useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Category form state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("cart");
  const [newCategoryColor, setNewCategoryColor] = useState("#3B82F6");
  const [iconSearchQuery, setIconSearchQuery] = useState("");

  const filteredIcons = CATEGORY_ICONS.filter((icon) =>
    icon.toLowerCase().includes(iconSearchQuery.toLowerCase())
  );

  const resetForm = () => {
    setTitle("");
    setAmount("");
    setCategory("");
    setDueDate(new Date());
    setReminderDate(null);
    setEditingBill(null);
  };

  const resetCategoryForm = () => {
    setNewCategoryName("");
    setNewCategoryIcon("cart");
    setNewCategoryColor("#3B82F6");
    setIconSearchQuery("");
    setEditingCategory(null);
  };

  const formatDateDDMMYYYY = (date: Date) => {
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  const handleAdd = async () => {
    if (!title.trim() || !amount.trim() || !category) {
      showToast("Please fill all fields", "error");
      return;
    }
    let finalReminderDate: Date;
    if (reminderDate) {
      finalReminderDate = new Date(reminderDate);
    } else {
      finalReminderDate = new Date(dueDate);
      finalReminderDate.setDate(finalReminderDate.getDate() - 1);
      finalReminderDate.setHours(9, 0, 0, 0);
    }
    try {
      await addBillReminder({
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        dueDate: dueDate.toISOString(),
        isPaid: false,
        reminderDate: finalReminderDate.toISOString(),
      });
      showToast("Bill reminder added", "success");
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      showToast("Failed to add reminder", "error");
    }
  };

  const handleEdit = (bill: any) => {
    setEditingBill(bill);
    setTitle(bill.title);
    setAmount(bill.amount.toString());
    setCategory(bill.category);
    setDueDate(new Date(bill.dueDate));
    setReminderDate(bill.reminderDate ? new Date(bill.reminderDate) : null);
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!title.trim() || !amount.trim() || !category || !editingBill) {
      showToast("Please fill all fields", "error");
      return;
    }
    let finalReminderDate: Date;
    if (reminderDate) {
      finalReminderDate = new Date(reminderDate);
    } else {
      finalReminderDate = new Date(dueDate);
      finalReminderDate.setDate(finalReminderDate.getDate() - 1);
      finalReminderDate.setHours(9, 0, 0, 0);
    }
    try {
      await updateBillReminder(editingBill.id, {
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        dueDate: dueDate.toISOString(),
        reminderDate: finalReminderDate.toISOString(),
      });
      showToast("Bill reminder updated", "success");
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      showToast("Failed to update reminder", "error");
    }
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      "Delete Bill Reminder",
      `Are you sure you want to delete "${title}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteBillReminder(id);
              showToast("Bill reminder deleted", "success");
            } catch (error) {
              showToast("Failed to delete reminder", "error");
            }
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = (id: string, title: string) => {
    Alert.alert("Mark as Paid", `Mark "${title}" as paid?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Mark Paid",
        onPress: async () => {
          try {
            await markAsPaid(id);
            showToast("Bill marked as paid", "success");
          } catch (error) {
            showToast("Failed to mark as paid", "error");
          }
        },
      },
    ]);
  };

  // Category management handlers
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast("Please enter a category name", "error");
      return;
    }

    try {
      await addCategory({
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        color: newCategoryColor,
        type: "expense",
      });
      showToast("Category created successfully", "success");
      setShowCreateCategoryModal(false);
      resetCategoryForm();
    } catch (error) {
      showToast("Failed to create category", "error");
    }
  };

  const handleEditCategoryItem = (cat: Category) => {
    setEditingCategory(cat);
    setNewCategoryName(cat.name);
    setNewCategoryIcon(cat.icon);
    setNewCategoryColor(cat.color);
    setShowManageCategoriesModal(false);
    setShowEditCategoryModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      showToast("Please enter a category name", "error");
      return;
    }

    try {
      await updateCategory(editingCategory.id, {
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        color: newCategoryColor,
      });
      showToast("Category updated successfully", "success");
      setShowEditCategoryModal(false);
      resetCategoryForm();
    } catch (error) {
      showToast("Failed to update category", "error");
    }
  };

  const handleDeleteCategory = (cat: Category) => {
    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${cat.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(cat.id);
              if (category === cat.name) {
                setCategory("");
              }
              showToast("Category deleted", "success");
            } catch (error) {
              showToast("Failed to delete category", "error");
            }
          },
        },
      ]
    );
  };

  const renderIconSelector = () => (
    <View style={styles.iconSelectorContainer}>
      <TextInput
        value={iconSearchQuery}
        onChangeText={setIconSearchQuery}
        placeholder="Search icons..."
        placeholderTextColor={colors.muted}
        style={[
          styles.iconSearchInput,
          {
            color: colors.text,
            borderColor: colors.inputBorder,
            backgroundColor: colors.inputBackground,
          },
        ]}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.iconScroll}
      >
        {filteredIcons.slice(0, 30).map((icon) => (
          <TouchableOpacity
            key={icon}
            onPress={() => setNewCategoryIcon(icon)}
            style={[
              styles.iconOption,
              {
                backgroundColor:
                  newCategoryIcon === icon
                    ? newCategoryColor
                    : colors.inputBackground,
                borderColor:
                  newCategoryIcon === icon
                    ? newCategoryColor
                    : colors.inputBorder,
              },
            ]}
          >
            <Ionicons
              name={icon as any}
              size={24}
              color={newCategoryIcon === icon ? "#fff" : colors.text}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderColorSelector = () => (
    <View style={styles.colorGrid}>
      {CATEGORY_COLORS.map((color) => (
        <TouchableOpacity
          key={color}
          onPress={() => setNewCategoryColor(color)}
          style={[
            styles.colorOption,
            { backgroundColor: color },
            newCategoryColor === color && styles.colorOptionSelected,
          ]}
        >
          {newCategoryColor === color && (
            <Ionicons name="checkmark" size={18} color="#fff" />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCategoryFormContent = (isEdit: boolean) => (
    <>
      <Text style={[styles.modalLabel, { color: colors.text }]}>
        {t("addTransaction.categoryName")}
      </Text>
      <TextInput
        value={newCategoryName}
        onChangeText={setNewCategoryName}
        placeholder={t("addTransaction.enterCategoryName")}
        placeholderTextColor={colors.muted}
        style={[
          styles.modalInput,
          {
            color: colors.text,
            borderColor: colors.inputBorder,
            backgroundColor: colors.inputBackground,
            marginBottom: 8,
          },
        ]}
      />

      <Text style={[styles.modalLabel, { color: colors.text }]}>
        {t("addTransaction.selectIcon")}
      </Text>
      {renderIconSelector()}

      <Text style={[styles.modalLabel, { color: colors.text }]}>
        {t("addTransaction.selectColor")}
      </Text>
      {renderColorSelector()}

      <View style={styles.previewContainer}>
        <Text style={[styles.modalLabel, { color: colors.text }]}>
          {t("addTransaction.preview")}
        </Text>
        <View
          style={[
            styles.categoryPreview,
            { backgroundColor: `${newCategoryColor}15` },
          ]}
        >
          <Ionicons
            name={newCategoryIcon as any}
            size={24}
            color={newCategoryColor}
          />
          <Text style={[styles.previewText, { color: newCategoryColor }]}>
            {newCategoryName || t("addTransaction.categoryName")}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={isEdit ? handleUpdateCategory : handleCreateCategory}
        style={[
          styles.saveButton,
          {
            backgroundColor: colors.primary,
            marginTop: 24,
            marginBottom: Platform.OS === "android" ? 16 : 8,
          },
        ]}
      >
        <Text style={styles.saveText}>
          {isEdit
            ? t("addTransaction.updateCategoryButton")
            : t("addTransaction.createCategoryButton")}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderBill = ({ item }: any) => {
    const isOverdue = new Date(item.dueDate) < new Date();

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.cardBorder },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            {isOverdue && (
              <Text style={[styles.overdueText, { color: colors.danger }]}>
                Overdue
              </Text>
            )}
          </View>
          <Text
            style={[styles.cardAmount, { color: colors.primary }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatAmount(item.amount)}
          </Text>
        </View>
        <View style={styles.cardMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="folder" size={14} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>
              {item.category}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={14} color={colors.muted} />
            <Text style={[styles.metaText, { color: colors.muted }]}>
              Due: {new Date(item.dueDate).toLocaleDateString()}
            </Text>
          </View>
        </View>
        {item.reminderDate && (
          <View style={styles.reminderInfo}>
            <Ionicons name="notifications" size={14} color={colors.warning} />
            <Text style={[styles.reminderText, { color: colors.muted }]}>
              Reminder: {new Date(item.reminderDate).toLocaleString()}
            </Text>
          </View>
        )}
        <View style={styles.cardActions}>
          <TouchableOpacity
            onPress={() => handleEdit(item)}
            style={[
              styles.actionButton,
              { backgroundColor: colors.primary + "15" },
            ]}
          >
            <Ionicons name="pencil" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleMarkAsPaid(item.id, item.title)}
            style={[
              styles.actionButton,
              { backgroundColor: colors.success + "15" },
            ]}
          >
            <Ionicons name="checkmark" size={18} color={colors.success} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDelete(item.id, item.title)}
            style={[
              styles.actionButton,
              { backgroundColor: colors.danger + "15" },
            ]}
          >
            <Ionicons name="trash" size={18} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderForm = (isEdit: boolean) => (
    <>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder={t("billReminders.billTitle")}
        placeholderTextColor={colors.muted}
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.inputBorder,
            backgroundColor: colors.inputBackground,
          },
        ]}
      />
      <TextInput
        value={amount}
        onChangeText={setAmount}
        placeholder={t("billReminders.amount")}
        placeholderTextColor={colors.muted}
        keyboardType="numeric"
        style={[
          styles.input,
          {
            color: colors.text,
            borderColor: colors.inputBorder,
            backgroundColor: colors.inputBackground,
          },
        ]}
      />

      <View style={styles.categoryHeader}>
        <Text style={[styles.label, { color: colors.text }]}>
          {t("addTransaction.category")}
        </Text>
        <View style={styles.categoryActions}>
          <TouchableOpacity
            onPress={() => setShowCreateCategoryModal(true)}
            style={[
              styles.categoryActionBtn,
              { backgroundColor: colors.primary + "20" },
            ]}
          >
            <Ionicons name="add" size={16} color={colors.primary} />
            <Text
              style={[styles.categoryActionText, { color: colors.primary }]}
            >
              {t("addTransaction.add")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowManageCategoriesModal(true)}
            style={[
              styles.categoryActionBtn,
              { backgroundColor: colors.muted + "20" },
            ]}
          >
            <Ionicons name="settings" size={16} color={colors.muted} />
            <Text style={[styles.categoryActionText, { color: colors.muted }]}>
              {t("addTransaction.manage")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryScroll}
      >
        {expenseCategories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            onPress={() => setCategory(cat.name)}
            style={[
              styles.categoryChip,
              category === cat.name && { backgroundColor: cat.color },
            ]}
          >
            <Ionicons
              name={cat.icon as any}
              size={18}
              color={category === cat.name ? "#fff" : cat.color}
            />
            <Text
              style={[
                styles.categoryText,
                { color: category === cat.name ? "#fff" : cat.color },
              ]}
            >
              {translateCategoryName(cat.name, t)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={[styles.label, { color: colors.text }]}>
        {t("billReminders.dueDate")}
      </Text>
      <TouchableOpacity
        onPress={() => setShowDueDatePicker(true)}
        style={[
          styles.dateButton,
          {
            borderColor: colors.inputBorder,
            backgroundColor: colors.inputBackground,
          },
        ]}
      >
        <Text style={{ color: colors.text }}>
          {formatDateDDMMYYYY(dueDate)}
        </Text>
        <Ionicons name="calendar" size={20} color={colors.primary} />
      </TouchableOpacity>

      {Platform.OS === "android" && showDueDatePicker && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display="default"
          onChange={(e, d) => {
            setShowDueDatePicker(false);
            if (d) setDueDate(d);
          }}
        />
      )}

      {Platform.OS === "ios" && showDueDatePicker && (
        <Modal
          visible={showDueDatePicker}
          transparent
          animationType="slide"
          statusBarTranslucent
        >
          <View style={styles.iosPickerOverlay}>
            <View
              style={[
                styles.iosPickerContent,
                { backgroundColor: colors.card },
              ]}
            >
              <DateTimePicker
                value={dueDate}
                mode="date"
                display="spinner"
                textColor={colors.text}
                onChange={(e, d) => d && setDueDate(d)}
              />
              <TouchableOpacity
                onPress={() => setShowDueDatePicker(false)}
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.doneText}>{t("transactions.done")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <Text style={[styles.label, { color: colors.text }]}>
        {t("billReminders.reminderDate")}
      </Text>
      <View style={styles.dateTimeRow}>
        <TouchableOpacity
          onPress={() => setShowReminderDatePicker(true)}
          style={[
            styles.dateButton,
            {
              borderColor: colors.inputBorder,
              backgroundColor: colors.inputBackground,
              flex: 1,
            },
          ]}
        >
          <Text style={{ color: colors.text }}>
            {reminderDate
              ? formatDateDDMMYYYY(reminderDate)
              : t("billReminders.selectDate")}
          </Text>
          <Ionicons name="calendar" size={20} color={colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowReminderTimePicker(true)}
          style={[
            styles.dateButton,
            {
              borderColor: colors.inputBorder,
              backgroundColor: colors.inputBackground,
              flex: 1,
            },
          ]}
        >
          <Text style={{ color: colors.text }}>
            {reminderDate
              ? reminderDate.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : t("billReminders.selectTime")}
          </Text>
          <Ionicons name="time" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {Platform.OS === "android" && showReminderDatePicker && (
        <DateTimePicker
          value={reminderDate || new Date()}
          mode="date"
          display="default"
          onChange={(e, d) => {
            setShowReminderDatePicker(false);
            if (e.type === "set" && d) {
              const newDate = reminderDate
                ? new Date(reminderDate)
                : new Date();
              newDate.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
              setReminderDate(newDate);
            }
          }}
        />
      )}

      {Platform.OS === "android" && showReminderTimePicker && (
        <DateTimePicker
          value={reminderDate || new Date()}
          mode="time"
          display="default"
          onChange={(e, t) => {
            setShowReminderTimePicker(false);
            if (e.type === "set" && t) {
              const newDate = reminderDate
                ? new Date(reminderDate)
                : new Date();
              newDate.setHours(t.getHours(), t.getMinutes(), 0, 0);
              setReminderDate(newDate);
            }
          }}
        />
      )}

      {Platform.OS === "ios" && showReminderDatePicker && (
        <Modal
          visible={showReminderDatePicker}
          transparent
          animationType="slide"
          statusBarTranslucent
        >
          <View style={styles.iosPickerOverlay}>
            <View
              style={[
                styles.iosPickerContent,
                { backgroundColor: colors.card },
              ]}
            >
              <DateTimePicker
                value={reminderDate || new Date()}
                mode="date"
                display="spinner"
                textColor={colors.text}
                onChange={(e, d) => {
                  if (d) {
                    const newDate = reminderDate
                      ? new Date(reminderDate)
                      : new Date();
                    newDate.setFullYear(
                      d.getFullYear(),
                      d.getMonth(),
                      d.getDate()
                    );
                    setReminderDate(newDate);
                  }
                }}
              />
              <TouchableOpacity
                onPress={() => setShowReminderDatePicker(false)}
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.doneText}>{t("transactions.done")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === "ios" && showReminderTimePicker && (
        <Modal
          visible={showReminderTimePicker}
          transparent
          animationType="slide"
          statusBarTranslucent
        >
          <View style={styles.iosPickerOverlay}>
            <View
              style={[
                styles.iosPickerContent,
                { backgroundColor: colors.card },
              ]}
            >
              <DateTimePicker
                value={reminderDate || new Date()}
                mode="time"
                display="spinner"
                textColor={colors.text}
                onChange={(e, t) => {
                  if (t) {
                    const newDate = reminderDate
                      ? new Date(reminderDate)
                      : new Date();
                    newDate.setHours(t.getHours(), t.getMinutes(), 0, 0);
                    setReminderDate(newDate);
                  }
                }}
              />
              <TouchableOpacity
                onPress={() => setShowReminderTimePicker(false)}
                style={[styles.doneButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.doneText}>{t("transactions.done")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <TouchableOpacity
        onPress={isEdit ? handleUpdate : handleAdd}
        style={[styles.saveButton, { backgroundColor: colors.primary }]}
      >
        <Text style={styles.saveText}>
          {isEdit ? t("billReminders.update") : t("billReminders.save")}
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t("billReminders.title")}
        rightComponent={
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      {billReminders.length === 0 ? (
        <EmptyState
          icon="notifications"
          title={t("billReminders.noBillReminders")}
          description={t("billReminders.noBillRemindersDescription")}
        />
      ) : (
        <FlatList
          data={billReminders}
          keyExtractor={(item) => item.id}
          renderItem={renderBill}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Add Modal */}
      <ModalWrapper
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={t("billReminders.addBillReminder")}
      >
        {renderForm(false)}
      </ModalWrapper>

      {/* Edit Modal */}
      <ModalWrapper
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
        }}
        title={t("billReminders.editBillReminder")}
      >
        {renderForm(true)}
      </ModalWrapper>

      {/* Create Category Modal */}
      <ModalWrapper
        visible={showCreateCategoryModal}
        onClose={() => {
          setShowCreateCategoryModal(false);
          resetCategoryForm();
        }}
        title={t("addTransaction.createCategory")}
      >
        {renderCategoryFormContent(false)}
      </ModalWrapper>

      {/* Edit Category Modal */}
      <ModalWrapper
        visible={showEditCategoryModal}
        onClose={() => {
          setShowEditCategoryModal(false);
          resetCategoryForm();
        }}
        title={t("addTransaction.editCategory")}
      >
        {renderCategoryFormContent(true)}
      </ModalWrapper>

      {/* Manage Categories Modal */}
      <ModalWrapper
        visible={showManageCategoriesModal}
        onClose={() => setShowManageCategoriesModal(false)}
        title={t("addTransaction.manageCategories")}
        scrollEnabled={false}
      >
        {expenseCategories.length === 0 ? (
          <Text style={[styles.noCategoriesText, { color: colors.muted }]}>
            {t("addTransaction.noCategoriesToManage")}
          </Text>
        ) : (
          <FlatList
            data={expenseCategories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.manageCategoryItem,
                  { borderColor: colors.cardBorder },
                ]}
              >
                <View
                  style={[
                    styles.manageCategoryIcon,
                    { backgroundColor: `${item.color}15` },
                  ]}
                >
                  <Ionicons
                    name={item.icon as any}
                    size={24}
                    color={item.color}
                  />
                </View>
                <Text
                  style={[
                    styles.manageCategoryName,
                    { color: item.color, flex: 1 },
                  ]}
                >
                  {translateCategoryName(item.name, t)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleEditCategoryItem(item)}
                  style={[
                    styles.manageCategoryBtn,
                    { backgroundColor: colors.primary + "15" },
                  ]}
                >
                  <Ionicons name="pencil" size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteCategory(item)}
                  style={[
                    styles.manageCategoryBtn,
                    { backgroundColor: colors.danger + "15" },
                  ]}
                >
                  <Ionicons name="trash" size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            )}
            style={{ maxHeight: 400 }}
          />
        )}
      </ModalWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  list: { padding: 20 },
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  overdueText: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  cardAmount: { fontSize: 18, fontWeight: "700" },
  cardMeta: { flexDirection: "row", gap: 16, marginBottom: 8 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13 },
  reminderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  reminderText: { fontSize: 12 },
  cardActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  actionButton: { padding: 8, borderRadius: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryActions: { flexDirection: "row", gap: 8 },
  categoryActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  categoryActionText: { fontSize: 11, fontWeight: "600" },
  categoryScroll: { marginBottom: 16 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    gap: 6,
  },
  categoryText: { fontSize: 14, fontWeight: "500" },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
  },
  dateTimeRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  iosPickerOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  iosPickerContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  doneButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  doneText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  // Category modal styles
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  iconSelectorContainer: { marginBottom: 8 },
  iconSearchInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 10,
  },
  iconScroll: { maxHeight: 60 },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
    borderWidth: 1,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  previewContainer: { marginTop: 8, marginBottom: 8 },
  categoryPreview: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  previewText: { fontSize: 16, fontWeight: "600" },
  noCategoriesText: { fontSize: 14, textAlign: "center", paddingVertical: 20 },
  manageCategoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  manageCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  manageCategoryName: { fontSize: 16, fontWeight: "500" },
  manageCategoryBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
