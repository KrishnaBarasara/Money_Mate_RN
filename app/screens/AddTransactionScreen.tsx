import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Modal,
  FlatList,
  Alert,
} from "react-native";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColors } from "../context/ThemeContext";
import { useTransactions } from "../context/TransactionContext";
import { useCategories } from "../context/CategoryContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { MainStackParamList } from "../navigation/TabNavigator";
import { PaymentMode, Category } from "../utils/types";
import { CATEGORY_ICONS, CATEGORY_COLORS } from "../utils/constants";
import { translateCategoryName } from "../utils/categoryTranslations";
import ScreenHeader from "../components/ScreenHeader";
import ModalWrapper from "../components/ModalWrapper";

type RouteProps = RouteProp<MainStackParamList, "AddTransaction">;

export default function AddTransactionScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProps>();
  const { colors } = useThemeColors();
  const { addTransaction } = useTransactions();
  const {
    expenseCategories,
    incomeCategories,
    addCategory,
    updateCategory,
    deleteCategory,
    loading: categoriesLoading,
  } = useCategories();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Transaction state
  const [type, setType] = useState<"income" | "expense">(
    route.params?.type || "expense"
  );
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date());
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("upi");
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  const categories = type === "expense" ? expenseCategories : incomeCategories;

  const filteredIcons = CATEGORY_ICONS.filter((icon) =>
    icon.toLowerCase().includes(iconSearchQuery.toLowerCase())
  );

  const resetCategoryForm = () => {
    setNewCategoryName("");
    setNewCategoryIcon("cart");
    setNewCategoryColor("#3B82F6");
    setIconSearchQuery("");
    setEditingCategory(null);
  };

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
        type: type,
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

  const handleSave = async () => {
    if (!amount.trim() || !category) {
      showToast(t("addTransaction.pleaseFillAllFields"), "error");
      return;
    }

    try {
      await addTransaction({
        type,
        amount: parseFloat(amount),
        category,
        description: description.trim(),
        date: date.toISOString(),
        paymentMode,
      });
      showToast(t("addTransaction.transactionAdded"), "success");
      navigation.goBack();
    } catch (error) {
      showToast(t("addTransaction.failedToAdd"), "error");
    }
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
        <Text style={[styles.modalLabel, { color: colors.text }]}>{t("addTransaction.preview")}</Text>
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
          styles.createButton,
          {
            backgroundColor: colors.primary,
            marginTop: 24,
            marginBottom: Platform.OS === "android" ? 16 : 8,
          },
        ]}
      >
        <Text style={styles.createButtonText}>
          {isEdit ? t("addTransaction.updateCategoryButton") : t("addTransaction.createCategoryButton")}
        </Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader title={t("addTransaction.title")} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Type Selection */}
        <View style={styles.typeRow}>
          {(["expense", "income"] as const).map((tType) => (
            <TouchableOpacity
              key={tType}
              onPress={() => {
                setType(tType);
                setCategory("");
              }}
              style={[
                styles.typeButton,
                type === tType && {
                  backgroundColor:
                    tType === "expense" ? colors.danger : colors.success,
                },
              ]}
            >
              <Ionicons
                name={tType === "expense" ? "arrow-down" : "arrow-up"}
                size={20}
                color={type === tType ? "#fff" : colors.text}
              />
              <Text
                style={[
                  styles.typeText,
                  { color: type === tType ? "#fff" : colors.text },
                ]}
              >
                {t(`transactions.${tType}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Amount */}
        <Text style={[styles.label, { color: colors.text }]}>{t("addTransaction.amount")}</Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder="0.00"
          placeholderTextColor={colors.muted}
          keyboardType="numeric"
          style={[
            styles.amountInput,
            {
              color: colors.text,
              borderColor: colors.inputBorder,
              backgroundColor: colors.inputBackground,
            },
          ]}
        />

        {/* Category */}
        <View style={styles.categoryHeader}>
          <Text style={[styles.label, { color: colors.text }]}>{t("addTransaction.category")}</Text>
          <View style={styles.categoryActions}>
            <TouchableOpacity
              onPress={() => setShowCreateCategoryModal(true)}
              style={[
                styles.categoryActionBtn,
                { backgroundColor: colors.primary + "20" },
              ]}
            >
              <Ionicons name="add" size={18} color={colors.primary} />
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
              <Ionicons name="settings" size={18} color={colors.muted} />
              <Text
                style={[styles.categoryActionText, { color: colors.muted }]}
              >
                {t("addTransaction.manage")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {categoriesLoading ? (
          <Text style={[styles.loadingText, { color: colors.muted }]}>
            {t("common.loading")}
          </Text>
        ) : categories.length === 0 ? (
          <View style={styles.noCategoriesContainer}>
            <Text style={[styles.noCategoriesText, { color: colors.muted }]}>
              {t("addTransaction.noCategoriesToManage")}
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {categories.map((cat) => (
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
        )}

        {/* Description */}
        <Text style={[styles.label, { color: colors.text }]}>{t("addTransaction.description")}</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t("addTransaction.addNotes")}
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

        {/* Date */}
        <Text style={[styles.label, { color: colors.text }]}>{t("addTransaction.date")}</Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          style={[
            styles.dateButton,
            {
              borderColor: colors.inputBorder,
              backgroundColor: colors.inputBackground,
            },
          ]}
        >
          <Text style={{ color: colors.text }}>
            {date.toLocaleDateString()}
          </Text>
          <Ionicons name="calendar" size={20} color={colors.primary} />
        </TouchableOpacity>

        {Platform.OS === "android" && showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(e, d) => {
              setShowDatePicker(false);
              if (d) setDate(d);
            }}
          />
        )}

        {Platform.OS === "ios" && showDatePicker && (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="slide"
            statusBarTranslucent
          >
            <View style={styles.modalOverlay}>
              <View
                style={[styles.modalContent, { backgroundColor: colors.card }]}
              >
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="spinner"
                  textColor={colors.text}
                  onChange={(e, d) => d && setDate(d)}
                />
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  style={[
                    styles.doneButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.doneText}>{t("transactions.done")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        )}

        {/* Payment Mode */}
        <Text style={[styles.label, { color: colors.text }]}>{t("addTransaction.paymentMode")}</Text>
        <View style={styles.paymentRow}>
          {(["cash", "upi", "card", "bank"] as PaymentMode[]).map((pm) => (
            <TouchableOpacity
              key={pm}
              onPress={() => setPaymentMode(pm)}
              style={[
                styles.paymentButton,
                {
                  backgroundColor:
                    paymentMode === pm
                      ? colors.primary
                      : colors.inputBackground,
                  borderColor: colors.inputBorder,
                },
              ]}
            >
              <Text
                style={{ color: paymentMode === pm ? "#fff" : colors.text }}
              >
                {pm.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.saveText}>{t("addTransaction.save")}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Create Category Modal */}
      <ModalWrapper
        visible={showCreateCategoryModal}
        onClose={() => {
          setShowCreateCategoryModal(false);
          resetCategoryForm();
        }}
        title={type === "expense" ? t("addTransaction.createCategory") : t("addTransaction.createIncomeCategory")}
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
        title={type === "expense" ? t("addTransaction.manageCategories") : t("addTransaction.manageIncomeCategories")}
        scrollEnabled={false}
      >
        {categories.length === 0 ? (
          <Text style={[styles.noCategoriesText, { color: colors.muted }]}>
            {t("addTransaction.noCategoriesToManage")}
          </Text>
        ) : (
          <FlatList
            data={categories}
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
  content: { padding: 20 },
  typeRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  typeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  typeText: { fontSize: 16, fontWeight: "600" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  amountInput: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    paddingVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  categoryActionText: { fontSize: 12, fontWeight: "600" },
  categoryScroll: { marginBottom: 20 },
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
  loadingText: { fontSize: 14, marginBottom: 20 },
  noCategoriesContainer: {
    paddingVertical: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  noCategoriesText: { fontSize: 14, textAlign: "center" },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
  dateButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
  },
  paymentRow: { flexDirection: "row", gap: 12, marginBottom: 30 },
  paymentButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  saveButton: { paddingVertical: 16, borderRadius: 12, alignItems: "center" },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
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
  // Category Modal Styles
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
  createButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 20,
  },
  createButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  // Manage Categories Styles
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
