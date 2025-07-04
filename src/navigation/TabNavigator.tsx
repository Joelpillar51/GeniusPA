import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { OverviewScreen } from '../screens/OverviewScreen';
import { RecordingsScreen } from '../screens/RecordingsScreen';
import { DocumentsScreen } from '../screens/DocumentsScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { SubscriptionScreen } from '../screens/SubscriptionScreen';

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#10B981',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Overview"
        component={OverviewScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Recordings"
        component={RecordingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="mic" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Documents"
        component={DocumentsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AI Chat"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Subscription"
        component={SubscriptionScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="diamond" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};