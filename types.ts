
export enum ViewState {
  ONBOARDING = 'ONBOARDING',
  HOME = 'HOME',
  CAMERA = 'CAMERA',
  EDITOR = 'EDITOR',
  RESULT = 'RESULT',
  TOOLS = 'TOOLS',
  FILES = 'FILES',
  SETTINGS = 'SETTINGS',
  PREMIUM = 'PREMIUM',
  CLOUD = 'CLOUD',
  PROFILE = 'PROFILE'
}

export interface ScannedPage {
  id: string;
  originalDataUrl: string; // Base64
  processedDataUrl: string; // Base64 (after crop/filter)
  filter: FilterType;
  rotation: number;
}

export interface DocumentRecord {
  id: string;
  title: string;
  date: number;
  pages: ScannedPage[];
  extractedText?: string;
  summary?: string;
  tags: string[];
  thumbnailUrl?: string;
  isSynced: boolean;
  sizeBytes: number;
}

export enum FilterType {
  ORIGINAL = 'Original',
  GRAYSCALE = 'B&W',
  MAGIC = 'Magic', // High contrast
  LIGHTEN = 'Lighten'
}

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export type LanguageCode = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ko' | 'hi' | 'ar' | 'ur' | 'ru';

export type UserPlan = 'FREE' | 'PRO';

export interface UserStats {
  ocrCountToday: number;
  translationCountToday: number;
  lastResetDate: string; // YYYY-MM-DD
}

export const FREE_LIMITS = {
  OCR_DAILY: 5,
  TRANSLATE_DAILY: 3,
  CLOUD_STORAGE: 0, // Not available
};

export const PRO_FEATURES = {
  CLOUD_STORAGE_GB: 50,
  NO_ADS: true,
  NO_WATERMARK: true,
  UNLIMITED_OCR: true,
};

// ADMOB CONSTANTS
export const ADMOB_CONFIG = {
  APP_ID: 'ca-app-pub-1181009023938079~3235429197',
  BANNER_ID: 'ca-app-pub-1181009023938079/2075209005',
  INTERSTITIAL_ID: 'ca-app-pub-1181009023938079/9762127330',
  REWARDED_ID: 'ca-app-pub-1181009023938079/9087339910',
};
