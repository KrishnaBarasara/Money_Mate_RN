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
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useCurrency } from "../context/CurrencyContext";
import { useRecurringExpenses } from "../context/RecurringExpenseContext";
import { useCategories } from "../context/CategoryContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { PaymentMode, Category } from "../utils/types";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "../utils/constants";
import { translateCategoryName } from "../utils/categoryTranslations";
import ScreenHeader from "../components/ScreenHeader";
import ModalWrapper from "../components/ModalWrapper";
import EmptyState from "../components/EmptyState";

export default function RecurringExpensesScreen() {
  const { colors } = useThemeColors();
  const { formatAmount } = useCurrency();
  const {
    recurringExpenses,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
  } = useRecurringExpenses();
  const { expenseCategories, addCategory, updateCategory, deleteCategory } =
    useCategories();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Expense form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [frequency, setFrequency] = useState<
    "daily" | "weekly" | "monthly" | "yearly"
  >("monthly");
  const [startDate, setStartDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("upi");

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
    setFrequency("monthly");
    setStartDate(new Date());
    setPaymentMode("upi");
  };

  const resetCategoryForm = () => {
    setNewCategoryName("");
    setNewCategoryIcon("cart");
    setNewCategoryColor("#3B82F6");
    setIconSearchQuery("");
    setEditingCategory(null);
  };

  const calculateNextDueDate = (start: Date, freq: typeof frequency): Date => {
    const next = new Date(start);
    switch (freq) {
      case "daily":
        next.setDate(next.getDate() + 1);
        break;
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  };

  const handleAdd = async () => {
    if (!title.trim() || !amount.trim() || !category) {
      showToast(t("addTransaction.pleaseFillAllFields"), "error");
      return;
    }
    try {
      await addRecurringExpense({
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        frequency,
        startDate: startDate.toISOString(),
        nextDueDate: calculateNextDueDate(startDate, frequency).toISOString(),
        paymentMode,
        isActive: true,
      });
      showToast(t("recurringExpenses.save"), "success");
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      showToast(t("addTransaction.failedToAdd"), "error");
    }
  };

  // Category management handlers
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showToast(t("addTransaction.pleaseEnterCategoryName"), "error");
      return;
    }

    try {
      await addCategory({
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        color: newCategoryColor,
        type: "expense",
      });
      showToast(t("addTransaction.categoryCreated"), "success");
      setShowCreateCategoryModal(false);
      resetCategoryForm();
    } catch (error) {
      showToast(t("addTransaction.failedToCreateCategory"), "error");
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setNewCategoryName(cat.name);
    setNewCategoryIcon(cat.icon);
    setNewCategoryColor(cat.color);
    setShowManageCategoriesModal(false);
    setShowEditCategoryModal(true);
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      showToast(t("addTransaction.pleaseEnterCategoryName"), "error");
      return;
    }

    try {
      await updateCategory(editingCategory.id, {
        name: newCategoryName.trim(),
        icon: newCategoryIcon,
        color: newCategoryColor,
      });
      showToast(t("addTransaction.categoryUpdated"), "success");
      setShowEditCategoryModal(false);
      resetCategoryForm();
    } catch (error) {
      showToast(t("addTransaction.failedToUpdateCategory"), "error");
    }
  };

  const handleDeleteExpense = (id: string, title: string) => {
    Alert.alert(
      t("common.delete"),
      `${t("common.delete")} "${title}"? ${t("modals.clearDataWarning")}`,
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteRecurringExpense(id);
              showToast(t("common.delete"), "success");
            } catch (error) {
              showToast(t("addTransaction.failedToDeleteCategory"), "error");
            }
          },
        },
      ]
    );
  };

  const handleDeleteCategory = (cat: Category) => {
    Alert.alert(
      t("addTransaction.deleteCategory"),
      t("addTransaction.deleteCategoryConfirm").replace("{name}", cat.name),
      [
        { text: t("common.cancel"), style: "cancel" },
        {
          text: t("common.delete"),
          style: "destructive",
          onPress: async () => {
            try {
              await deleteCategory(cat.id);
              if (category === cat.name) {
                setCategory("");
              }
              showToast(t("addTransaction.categoryDeleted"), "success");
            } catch (error) {
              showToast(t("addTransaction.failedToDeleteCategory"), "error");
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
        placeholder={t("addTransaction.searchIcons")}
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

  const renderCategoryForm = (isEdit: boolean) => (
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

  const renderExpense = ({ item }: any) => (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>
          {item.title}
        </Text>
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
          <Ionicons name="repeat" size={14} color={colors.muted} />
          <Text style={[styles.metaText, { color: colors.muted }]}>
            {item.frequency}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => handleDeleteExpense(item.id, item.title)}
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        title={t("recurringExpenses.title")}
        rightComponent={
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={[styles.addButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      {recurringExpenses.length === 0 ? (
        <EmptyState
          icon="repeat"
          title={t("recurringExpenses.noRecurringExpenses")}
          description={t("recurringExpenses.noRecurringExpensesDescription")}
        />
      ) : (
        <FlatList
          data={recurringExpenses}
          keyExtractor={(item) => item.id}
          renderItem={renderExpense}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Add Expense Modal */}
      <ModalWrapper
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title={t("recurringExpenses.addRecurringExpense")}
      >
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t("recurringExpenses.titleLabel")}
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
          placeholder={t("recurringExpenses.amount")}
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
              <Text
                style={[styles.categoryActionText, { color: colors.muted }]}
              >
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
          {t("recurringExpenses.frequency")}
        </Text>
        <View style={styles.frequencyRow}>
          {(["daily", "weekly", "monthly", "yearly"] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFrequency(f)}
              style={[
                styles.frequencyButton,
                {
                  borderColor: colors.inputBorder,
                  backgroundColor:
                    frequency === f ? colors.primary : colors.inputBackground,
                },
              ]}
            >
              <Text style={{ color: frequency === f ? "#fff" : colors.text }}>
                {t(`recurringExpenses.${f}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.text }]}>
          {t("recurringExpenses.paymentMode")}
        </Text>
        <View style={styles.paymentModeGrid}>
          {(["cash", "upi", "card", "bank"] as PaymentMode[]).map((pm) => (
            <TouchableOpacity
              key={pm}
              onPress={() => setPaymentMode(pm)}
              style={[
                styles.paymentModeOption,
                {
                  backgroundColor:
                    paymentMode === pm
                      ? colors.primary
                      : colors.inputBackground,
                  borderWidth: 1,
                  borderColor:
                    paymentMode === pm ? colors.primary : colors.inputBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.paymentModeText,
                  { color: paymentMode === pm ? "#fff" : colors.text },
                ]}
              >
                {pm.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleAdd}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.saveText}>{t("recurringExpenses.save")}</Text>
        </TouchableOpacity>
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
        {renderCategoryForm(false)}
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
        {renderCategoryForm(true)}
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
                  onPress={() => handleEditCategory(item)}
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
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  cardAmount: { fontSize: 18, fontWeight: "700" },
  cardMeta: { flexDirection: "row", gap: 16, marginBottom: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 13 },
  cardActions: { flexDirection: "row", justifyContent: "flex-end" },
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
  frequencyRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  frequencyButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  paymentModeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 24,
  },
  paymentModeOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  paymentModeText: { fontSize: 14, fontWeight: "600" },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
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
