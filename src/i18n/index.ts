import { en } from './en';
import { kn } from './kn';

export type Language = 'en' | 'kn';
export type TranslationKeys = typeof en;

const translations: Record<Language, TranslationKeys> = {
  en,
  kn,
};

// Get nested value from object using dot notation
function getNestedValue(obj: Record<string, any>, path: string): string | undefined {
  const keys = path.split('.');
  let current: any = obj;
  
  for (const key of keys) {
    if (current === undefined || current === null) {
      return undefined;
    }
    current = current[key];
  }
  
  return typeof current === 'string' ? current : undefined;
}

/**
 * Get translation for a key
 * Falls back to English if key not found in current language
 * Falls back to the key itself if not found in English either
 */
export function t(key: string, language: Language = 'en'): string {
  const translation = getNestedValue(translations[language], key);
  
  if (translation !== undefined) {
    return translation;
  }
  
  // Fallback to English
  if (language !== 'en') {
    const fallback = getNestedValue(translations.en, key);
    if (fallback !== undefined) {
      return fallback;
    }
  }
  
  // Return key as last resort (never blank)
  return key.split('.').pop() || key;
}

export { en, kn };
