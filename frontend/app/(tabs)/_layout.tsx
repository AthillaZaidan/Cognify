import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../constants/colors';
import { Font } from '../../constants/typography';
import { BehavioralTrackerProvider } from '../../context/BehavioralTrackerContext';

export default function TabsLayout() {
  const { auth } = useAuth();
  const isPsych = auth?.role === 'psychologist';

  const tabs = (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontFamily: Font.medium, fontSize: 11 },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          elevation: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="digital-habits"
        options={{
          title: 'Habits',
          href: isPsych ? null : undefined,
          tabBarIcon: ({ color, size }) => <Feather name="smartphone" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sleep"
        options={{
          title: 'Sleep',
          href: isPsych ? null : undefined,
          tabBarIcon: ({ color, size }) => <Feather name="moon" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="interventions"
        options={{
          title: 'Actions',
          href: isPsych ? null : undefined,
          tabBarIcon: ({ color, size }) => <Feather name="zap" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="psychologist"
        options={{
          title: 'Patients',
          href: !isPsych ? null : undefined,
          tabBarIcon: ({ color, size }) => <Feather name="users" size={size} color={color} />,
        }}
      />
    </Tabs>
  );

  if (auth?.role === 'patient') {
    return <BehavioralTrackerProvider>{tabs}</BehavioralTrackerProvider>;
  }
  return tabs;
}
