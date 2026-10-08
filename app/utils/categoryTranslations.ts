import { useLanguage } from "../context/LanguageContext";

/**
 * Translates a category name based on the current language
 * @param categoryName - The English category name (as stored in database)
 * @param t - Translation function from useLanguage hook
 * @returns Translated category name or original if translation not found
 */
export const translateCategoryName = (categoryName: string, t: (key: string) => string): string => {
  const translationKey = `categories.${categoryName}`;
  const translated = t(translationKey);
  
  // If translation returns the key itself, it means translation not found
  // Return original name in that case
  if (translated === translationKey) {
    return categoryName;
  }
  
  return translated;
};

