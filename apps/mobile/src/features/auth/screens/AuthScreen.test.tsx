import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AuthScreen } from './AuthScreen';
import * as useAuthModule from '../hooks/useAuth';
import type { AuthStackParamList } from '../../../navigation/types';

type AuthProps = NativeStackScreenProps<AuthStackParamList, 'Auth'>;

const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
} as unknown as AuthProps['navigation'];

const route = { key: 'k', name: 'Auth', params: undefined } as unknown as AuthProps['route'];

const signIn = jest.fn();
const signUp = jest.fn();
const signOut = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(useAuthModule, 'useAuth').mockReturnValue({
    session: null,
    user: null,
    loading: false,
    signIn,
    signUp,
    signOut,
    isAuthenticated: false,
  });
});

describe('AuthScreen', () => {
  it('renders sign-in mode by default with email and password fields', () => {
    const { getByText, getByPlaceholderText } = render(
      <AuthScreen navigation={navigation} route={route} />,
    );

    expect(getByText(/Hello/i)).toBeTruthy();
    expect(getByPlaceholderText('ton@email.com')).toBeTruthy();
    expect(getByPlaceholderText('Mot de passe')).toBeTruthy();
    expect(getByText(/Se connecter/i)).toBeTruthy();
  });

  it('switches to sign-up mode when the toggle link is tapped', () => {
    const { getByText, getByPlaceholderText } = render(
      <AuthScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(getByText(/Pas encore de compte/i));

    expect(getByPlaceholderText('Ton prénom')).toBeTruthy();
    expect(getByText(/Créer mon compte/i)).toBeTruthy();
  });

  it('calls signIn with the email and password on submit', async () => {
    signIn.mockResolvedValueOnce(undefined);

    const { getByPlaceholderText, getByTestId } = render(
      <AuthScreen navigation={navigation} route={route} />,
    );

    fireEvent.changeText(getByPlaceholderText('ton@email.com'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'Secret123');
    fireEvent.press(getByTestId('auth-submit'));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('jane@example.com', 'Secret123');
    });
  });

  it('calls signUp with name, email and password in sign-up mode', async () => {
    signUp.mockResolvedValueOnce(undefined);

    const { getByText, getByPlaceholderText, getByTestId } = render(
      <AuthScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(getByText(/Pas encore de compte/i));

    fireEvent.changeText(getByPlaceholderText('Ton prénom'), 'Jane');
    fireEvent.changeText(getByPlaceholderText('ton@email.com'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'Secret123');
    fireEvent.press(getByTestId('auth-submit'));

    await waitFor(() => {
      expect(signUp).toHaveBeenCalledWith('jane@example.com', 'Secret123', 'Jane');
    });
  });

  it('shows a danger bubble when the email format is invalid', () => {
    const { getByPlaceholderText, getByTestId, getByText } = render(
      <AuthScreen navigation={navigation} route={route} />,
    );

    fireEvent.changeText(getByPlaceholderText('ton@email.com'), 'not-an-email');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'Secret123');
    fireEvent.press(getByTestId('auth-submit'));

    expect(getByText(/format d’email/i)).toBeTruthy();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('shows a danger bubble when signIn rejects with a backend error', async () => {
    signIn.mockRejectedValueOnce(new Error('Invalid credentials'));

    const { getByPlaceholderText, getByTestId, findByText } = render(
      <AuthScreen navigation={navigation} route={route} />,
    );

    fireEvent.changeText(getByPlaceholderText('ton@email.com'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'Secret123');
    fireEvent.press(getByTestId('auth-submit'));

    expect(await findByText(/Invalid credentials/i)).toBeTruthy();
  });

  it('disables the submit button while a request is in flight', async () => {
    let resolveSignIn: () => void = () => {};
    signIn.mockImplementationOnce(
      () => new Promise<void>((resolve) => {
        resolveSignIn = resolve;
      }),
    );

    const { getByPlaceholderText, getByTestId } = render(
      <AuthScreen navigation={navigation} route={route} />,
    );

    fireEvent.changeText(getByPlaceholderText('ton@email.com'), 'jane@example.com');
    fireEvent.changeText(getByPlaceholderText('Mot de passe'), 'Secret123');
    fireEvent.press(getByTestId('auth-submit'));

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledTimes(1);
    });

    fireEvent.press(getByTestId('auth-submit'));
    expect(signIn).toHaveBeenCalledTimes(1);

    resolveSignIn();
  });
});
