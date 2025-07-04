export type SubscriptionPlan = 'free' | 'pro' | 'premium';

export interface SubscriptionLimits {
  maxRecordingDuration: number; // in seconds
  dailyRecordings: number;
  maxDocuments: number;
  aiChatProjects: number;
  exportFormats: string[];
  prioritySupport: boolean;
}

export interface DailyUsage {
  date: string; // YYYY-MM-DD
  recordingsCount: number;
  recordingDuration: number;
}

export interface SubscriptionState {
  plan: SubscriptionPlan;
  isActive: boolean;
  expiresAt?: Date;
  limits: SubscriptionLimits;
  dailyUsage: DailyUsage[];
  totalDocuments: number;
  chatProjectId?: string; // For free users, only one project allowed
  lastUpgradePrompt?: Date;
}

export interface UpgradePromptContext {
  feature: string;
  limitation: string;
  benefits: string[];
}