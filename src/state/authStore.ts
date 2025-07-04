import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserPreferences, AuthState, SignInData, SignUpData } from '../types/auth';

interface AuthStore extends AuthState {
  // Actions
  signIn: (data: SignInData) => Promise<void>;
  signUp: (data: SignUpData) => Promise<void>;
  signOut: () => void;
  updateUser: (updates: Partial<User>) => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  setHasSeenOnboarding: (seen: boolean) => void;
  setLoading: (loading: boolean) => void;
}

const defaultPreferences: UserPreferences = {
  recordingQuality: 'high',
  autoTranscribe: true,
  autoSummarize: true,
  defaultLanguage: 'en',
  theme: 'system',
  notifications: {
    transcriptionComplete: true,
    weeklyDigest: false,
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasSeenOnboarding: false,

      signIn: async (data: SignInData) => {
        set({ isLoading: true });
        
        try {
          // Simulate API call - in a real app, this would be an actual API call
          await new Promise(resolve => setTimeout(resolve, 800));
          
          // For demo purposes, create a mock user
          let userName = data.email.split('@')[0];
          
          // Special handling for demo account
          if (data.email === 'demo@geniuspa.com') {
            userName = 'Demo User';
          }
          
          const user: User = {
            id: `user_${Date.now()}`,
            email: data.email,
            name: userName,
            createdAt: new Date(),
            preferences: defaultPreferences,
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signUp: async (data: SignUpData) => {
        set({ isLoading: true });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const user: User = {
            id: `user_${Date.now()}`,
            email: data.email,
            name: data.name,
            createdAt: new Date(),
            preferences: defaultPreferences,
          };

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      signOut: () => {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          hasSeenOnboarding: false,
        });
      },

      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({
            user: { ...user, ...updates },
          });
        }
      },

      updatePreferences: (preferences: Partial<UserPreferences>) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              preferences: { ...user.preferences, ...preferences },
            },
          });
        }
      },

      setHasSeenOnboarding: (seen: boolean) => {
        set({ hasSeenOnboarding: seen });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        hasSeenOnboarding: state.hasSeenOnboarding,
      }),
    }
  )
);