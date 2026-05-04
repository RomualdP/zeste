import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../features/auth/hooks/useAuth';
import { OnboardingScreen } from '../features/auth/screens/OnboardingScreen';
import { AuthScreen } from '../features/auth/screens/AuthScreen';
import { LibraryScreen } from '../features/project/screens/LibraryScreen';
import { DetailScreen } from '../features/project/screens/DetailScreen';
import { ComposeScreen } from '../features/compose/screens/ComposeScreen';
import { GeneratingScreen } from '../features/compose/screens/GeneratingScreen';
import { ChapterListScreen } from '../features/scenario/screens/ChapterListScreen';
import { PlayerScreen } from '../features/player/screens/PlayerScreen';
import type { AuthStackParamList, MainStackParamList } from './types';
import { color } from '../shared/theme';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

const HAS_SEEN_ONBOARDING_KEY = 'hasSeenOnboarding';

function AuthNavigator({ initialRouteName }: { initialRouteName: keyof AuthStackParamList }) {
  return (
    <AuthStack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Auth" component={AuthScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainStack.Navigator>
      <MainStack.Screen
        name="Library"
        component={LibraryScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="Compose"
        component={ComposeScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="Generating"
        component={GeneratingScreen}
        options={{ headerShown: false }}
      />
      <MainStack.Screen
        name="Detail"
        component={DetailScreen}
        options={{ title: 'Épisode' }}
      />
      <MainStack.Screen
        name="ChapterList"
        component={ChapterListScreen}
        options={{ title: 'Chapitres' }}
      />
      <MainStack.Screen
        name="Player"
        component={PlayerScreen}
        options={{ title: 'Lecteur' }}
      />
    </MainStack.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(HAS_SEEN_ONBOARDING_KEY)
      .then((value) => setHasSeenOnboarding(value === 'true'))
      .catch(() => setHasSeenOnboarding(false));
  }, []);

  if (loading || hasSeenOnboarding === null) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={color.ink} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? (
        <MainNavigator />
      ) : (
        <AuthNavigator initialRouteName={hasSeenOnboarding ? 'Auth' : 'Onboarding'} />
      )}
    </NavigationContainer>
  );
}
