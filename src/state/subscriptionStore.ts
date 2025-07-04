import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionPlan, SubscriptionLimits, SubscriptionState, DailyUsage } from '../types/subscription';

const SUBSCRIPTION_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  free: {
    maxRecordingDuration: 300, // 5 minutes
    dailyRecordings: 3,
    maxDocuments: 1,
    aiChatProjects: 1,
    exportFormats: ['txt'],
    prioritySupport: false,
  },
  pro: {
    maxRecordingDuration: 3600, // 1 hour
    dailyRecordings: 50,
    maxDocuments: 100,
    aiChatProjects: 10,
    exportFormats: ['txt', 'rtf', 'md'],
    prioritySupport: false,
  },
  premium: {
    maxRecordingDuration: -1, // unlimited
    dailyRecordings: -1, // unlimited
    maxDocuments: -1, // unlimited
    aiChatProjects: -1, // unlimited
    exportFormats: ['txt', 'rtf', 'md'],
    prioritySupport: true,
  },
};

interface SubscriptionStore extends SubscriptionState {
  // Usage tracking
  addRecordingUsage: (duration: number) => boolean;
  addDocumentUsage: () => boolean;
  removeDocumentUsage: () => void;
  setChatProject: (itemId: string, itemType: 'recording' | 'document') => boolean;
  
  // Limit checking
  canRecord: () => { allowed: boolean; reason?: string };
  canAddDocument: () => { allowed: boolean; reason?: string };
  canUseAIChat: (itemId: string) => { allowed: boolean; reason?: string };
  canExport: (format: string) => { allowed: boolean; reason?: string };
  
  // Subscription management
  upgradePlan: (plan: SubscriptionPlan) => void;
  cancelSubscription: () => void;
  updateSubscription: (subscription: any) => void;
  resetUsage: () => void;
  getTodayUsage: () => DailyUsage;
  
  // Upgrade prompts
  shouldShowUpgradePrompt: () => boolean;
  recordUpgradePrompt: () => void;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const useSubscriptionStore = create<SubscriptionStore>()(
  persist(
    (set, get) => ({
      plan: 'free',
      isActive: true,
      limits: SUBSCRIPTION_LIMITS.free,
      dailyUsage: [],
      totalDocuments: 0,
      chatProjectId: undefined,
      lastUpgradePrompt: undefined,

      addRecordingUsage: (duration: number) => {
        const state = get();
        const today = getTodayString();
        
        // Check daily limit
        const todayUsage = state.dailyUsage.find(u => u.date === today);
        const currentCount = todayUsage?.recordingsCount || 0;
        
        if (state.limits.dailyRecordings !== -1 && currentCount >= state.limits.dailyRecordings) {
          return false;
        }
        
        // Check duration limit
        if (state.limits.maxRecordingDuration !== -1 && duration > state.limits.maxRecordingDuration) {
          return false;
        }
        
        // Update usage
        const updatedUsage = state.dailyUsage.filter(u => u.date !== today);
        updatedUsage.push({
          date: today,
          recordingsCount: currentCount + 1,
          recordingDuration: (todayUsage?.recordingDuration || 0) + duration,
        });
        
        set({ dailyUsage: updatedUsage });
        return true;
      },

      addDocumentUsage: () => {
        const state = get();
        
        if (state.limits.maxDocuments !== -1 && state.totalDocuments >= state.limits.maxDocuments) {
          return false;
        }
        
        set({ totalDocuments: state.totalDocuments + 1 });
        return true;
      },

      removeDocumentUsage: () => {
        const state = get();
        // For free users, don't actually decrease the count
        if (state.plan === 'free') {
          return;
        }
        
        set({ totalDocuments: Math.max(0, state.totalDocuments - 1) });
      },

      setChatProject: (itemId: string, itemType: 'recording' | 'document') => {
        const state = get();
        
        if (state.limits.aiChatProjects === -1) {
          return true; // Unlimited
        }
        
        if (state.limits.aiChatProjects === 1) {
          // For free users, only one project allowed
          if (!state.chatProjectId) {
            set({ chatProjectId: itemId });
            return true;
          } else if (state.chatProjectId === itemId) {
            return true; // Same project
          } else {
            return false; // Different project
          }
        }
        
        return true;
      },

      canRecord: () => {
        const state = get();
        const today = getTodayString();
        const todayUsage = state.dailyUsage.find(u => u.date === today);
        const currentCount = todayUsage?.recordingsCount || 0;
        
        if (state.limits.dailyRecordings !== -1 && currentCount >= state.limits.dailyRecordings) {
          return { 
            allowed: false, 
            reason: `Daily recording limit reached (${state.limits.dailyRecordings}/day). Upgrade to Pro for more recordings.` 
          };
        }
        
        return { allowed: true };
      },

      canAddDocument: () => {
        const state = get();
        
        if (state.limits.maxDocuments !== -1 && state.totalDocuments >= state.limits.maxDocuments) {
          return { 
            allowed: false, 
            reason: `Document limit reached (${state.limits.maxDocuments} total). Upgrade to Pro for 100 documents.` 
          };
        }
        
        return { allowed: true };
      },

      canUseAIChat: (itemId: string) => {
        const state = get();
        
        if (state.limits.aiChatProjects === 1) {
          if (!state.chatProjectId) {
            return { allowed: true };
          } else if (state.chatProjectId === itemId) {
            return { allowed: true };
          } else {
            return { 
              allowed: false, 
              reason: "Free users can only chat about one project. Upgrade your plan to chat about multiple recordings and documents." 
            };
          }
        }
        
        return { allowed: true };
      },

      canExport: (format: string) => {
        const state = get();
        
        if (!state.limits.exportFormats.includes(format)) {
          return { 
            allowed: false, 
            reason: `${format.toUpperCase()} export requires Pro subscription. Upgrade to access all export formats.` 
          };
        }
        
        return { allowed: true };
      },

      upgradePlan: (plan: SubscriptionPlan) => {
        set({
          plan,
          limits: SUBSCRIPTION_LIMITS[plan],
          isActive: true,
          expiresAt: plan !== 'free' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : undefined, // 30 days
        });
      },

      cancelSubscription: () => {
        set({ 
          plan: 'free',
          limits: SUBSCRIPTION_LIMITS.free,
          isActive: false,
          expiresAt: undefined,
          // Reset usage tracking
          dailyUsage: [],
          totalDocuments: 0,
          chatProjectId: undefined,
        });
      },

      updateSubscription: (subscription: any) => {
        set({
          plan: 'pro', // Always upgrade to pro for now
          limits: SUBSCRIPTION_LIMITS.pro,
          isActive: subscription.isActive,
          expiresAt: subscription.expiresAt,
        });
      },

      resetUsage: () => {
        set({
          dailyUsage: [],
          totalDocuments: 0,
          chatProjectId: undefined,
        });
      },

      getTodayUsage: () => {
        const state = get();
        const today = getTodayString();
        return state.dailyUsage.find(u => u.date === today) || {
          date: today,
          recordingsCount: 0,
          recordingDuration: 0,
        };
      },

      shouldShowUpgradePrompt: () => {
        const state = get();
        if (!state.lastUpgradePrompt) return true;
        
        const daysSinceLastPrompt = (Date.now() - state.lastUpgradePrompt.getTime()) / (1000 * 60 * 60 * 24);
        return daysSinceLastPrompt >= 1; // Show at most once per day
      },

      recordUpgradePrompt: () => {
        set({ lastUpgradePrompt: new Date() });
      },
    }),
    {
      name: 'subscription-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        plan: state.plan,
        isActive: state.isActive,
        expiresAt: state.expiresAt,
        limits: state.limits,
        dailyUsage: state.dailyUsage,
        totalDocuments: state.totalDocuments,
        chatProjectId: state.chatProjectId,
        lastUpgradePrompt: state.lastUpgradePrompt,
      }),
    }
  )
);