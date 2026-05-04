import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/hooks/useAuth';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { SignupScreen } from '../features/auth/screens/SignupScreen';
import { LibraryScreen } from '../features/project/screens/LibraryScreen';
import { DetailScreen } from '../features/project/screens/DetailScreen';
import { ComposeScreen } from '../features/compose/screens/ComposeScreen';
import { GeneratingScreen } from '../features/compose/screens/GeneratingScreen';
import { ChapterListScreen } from '../features/scenario/screens/ChapterListScreen';
import { PlayerScreen } from '../features/player/screens/PlayerScreen';
import type { AuthStackParamList, MainStackParamList } from './types';
import { color } from '../shared/theme';
import { ActivityIndicator, View } from 'react-native';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainStack = createNativeStackNavigator<MainStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
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

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={color.ink} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
