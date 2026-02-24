import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../features/auth/hooks/useAuth';
import { LoginScreen } from '../features/auth/screens/LoginScreen';
import { SignupScreen } from '../features/auth/screens/SignupScreen';
import { ProjectListScreen } from '../features/project/screens/ProjectListScreen';
import { CreateProjectScreen } from '../features/project/screens/CreateProjectScreen';
import { ProjectDetailScreen } from '../features/project/screens/ProjectDetailScreen';
import { AddSourceScreen } from '../features/project/screens/AddSourceScreen';
import { ConfigureScreen } from '../features/configuration/screens/ConfigureScreen';
import { ChapterListScreen } from '../features/scenario/screens/ChapterListScreen';
import { PlayerScreen } from '../features/player/screens/PlayerScreen';
import { ShareScreen } from '../features/sharing/screens/ShareScreen';
import type { AuthStackParamList, MainStackParamList } from './types';
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
        name="ProjectList"
        component={ProjectListScreen}
        options={{ title: 'Mes projets' }}
      />
      <MainStack.Screen
        name="CreateProject"
        component={CreateProjectScreen}
        options={{ title: 'Nouveau projet' }}
      />
      <MainStack.Screen
        name="ProjectDetail"
        component={ProjectDetailScreen}
        options={{ title: 'Projet' }}
      />
      <MainStack.Screen
        name="AddSource"
        component={AddSourceScreen}
        options={{ title: 'Ajouter une source' }}
      />
      <MainStack.Screen
        name="Configure"
        component={ConfigureScreen}
        options={{ title: 'Configuration' }}
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
      <MainStack.Screen
        name="Share"
        component={ShareScreen}
        options={{ title: 'Partager' }}
      />
    </MainStack.Navigator>
  );
}

export function RootNavigator() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
