import { NavigationProp } from '@react-navigation/native';

/**
 * Centralized subscription navigation helper
 * Handles all navigation to subscription/upgrade screens
 */
export const navigateToSubscription = (navigation: NavigationProp<any>) => {
  // Navigate to the dedicated subscription screen
  navigation.navigate('Subscription');
};

/**
 * Helper to check if user should see upgrade prompts
 */
export const shouldShowUpgradePrompts = (plan: string): boolean => {
  return plan === 'free';
};

/**
 * Get upgrade message based on feature
 */
export const getUpgradeMessage = (feature: string): string => {
  switch (feature) {
    case 'recording':
      return 'Upgrade to Pro for longer recordings and more daily limits';
    case 'document':
      return 'Upgrade to Pro for unlimited documents';
    case 'ai-chat':
      return 'Upgrade to Pro for multiple AI chat projects';
    case 'export':
      return 'Upgrade to Pro for all export formats';
    default:
      return 'Upgrade to Pro for unlimited features';
  }
};