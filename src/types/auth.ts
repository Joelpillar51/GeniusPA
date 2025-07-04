export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  preferences: UserPreferences;
  subscription?: {
    isActive: boolean;
    plan: 'free' | 'pro' | 'premium';
    billingCycle: 'monthly' | 'yearly';
    expiresAt: Date;
  };
}

export interface UserPreferences {
  recordingQuality: 'standard' | 'high' | 'lossless';
  autoTranscribe: boolean;
  autoSummarize: boolean;
  defaultLanguage: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    transcriptionComplete: boolean;
    weeklyDigest: boolean;
  };
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
}