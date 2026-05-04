import React from 'react';
import { Dimensions } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingScreen } from './OnboardingScreen';
import type { AuthStackParamList } from '../../../navigation/types';

type OnboardingProps = NativeStackScreenProps<AuthStackParamList, 'Onboarding'>;

const navigation = {
  navigate: jest.fn(),
  reset: jest.fn(),
  goBack: jest.fn(),
} as unknown as OnboardingProps['navigation'];

const route = { key: 'k', name: 'Onboarding', params: undefined } as unknown as OnboardingProps['route'];

beforeEach(() => {
  jest.clearAllMocks();
  AsyncStorage.clear();
});

describe('OnboardingScreen', () => {
  it('renders the first slide hero by default', () => {
    const { getByText } = render(<OnboardingScreen navigation={navigation} route={route} />);

    expect(getByText(/Transforme ce que tu/i)).toBeTruthy();
  });

  it('renders the three slides in the FlatList', () => {
    const { getByText } = render(<OnboardingScreen navigation={navigation} route={route} />);

    expect(getByText(/Transforme ce que tu/i)).toBeTruthy();
    expect(getByText(/À ton/i)).toBeTruthy();
    expect(getByText(/Écoute/i)).toBeTruthy();
  });

  it('persists hasSeenOnboarding=true and navigates to Auth when "Passer" is tapped', async () => {
    const { getByTestId } = render(<OnboardingScreen navigation={navigation} route={route} />);

    fireEvent.press(getByTestId('onboarding-skip'));

    await waitFor(() => {
      expect(AsyncStorage.getItem).toHaveBeenCalledWith('hasSeenOnboarding');
    });
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('hasSeenOnboarding', 'true');
    });
    expect(navigation.navigate).toHaveBeenCalledWith('Auth');
  });

  it('persists the flag and navigates to Auth when "Commencer" is tapped on the last slide', async () => {
    const { getByTestId } = render(<OnboardingScreen navigation={navigation} route={route} />);

    const width = Dimensions.get('window').width;
    fireEvent(getByTestId('onboarding-list'), 'momentumScrollEnd', {
      nativeEvent: {
        contentOffset: { x: width * 2, y: 0 },
        contentSize: { width: width * 3, height: 400 },
        layoutMeasurement: { width, height: 400 },
      },
    });

    fireEvent.press(getByTestId('onboarding-cta'));

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('hasSeenOnboarding', 'true');
    });
    expect(navigation.navigate).toHaveBeenCalledWith('Auth');
  });

  it('renders three pagination dots', () => {
    const { getByTestId } = render(<OnboardingScreen navigation={navigation} route={route} />);

    expect(getByTestId('onboarding-dot-0')).toBeTruthy();
    expect(getByTestId('onboarding-dot-1')).toBeTruthy();
    expect(getByTestId('onboarding-dot-2')).toBeTruthy();
  });
});
