import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders the label', () => {
    const { getByText } = render(<Button label="Continuer" onPress={() => {}} />);
    expect(getByText('Continuer')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Continuer" onPress={onPress} />);

    fireEvent.press(getByText('Continuer'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Button label="Continuer" onPress={onPress} disabled />);

    fireEvent.press(getByText('Continuer'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('does not call onPress when loading', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <Button label="Continuer" onPress={onPress} loading testID="cta" />,
    );

    fireEvent.press(getByTestId('cta'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('renders icon variant without a label', () => {
    const { getByTestId } = render(
      <Button
        variant="icon"
        onPress={() => {}}
        icon={<Text testID="arrow">→</Text>}
        testID="icon-btn"
      />,
    );

    expect(getByTestId('arrow')).toBeTruthy();
    expect(getByTestId('icon-btn')).toBeTruthy();
  });

  it('supports a secondary variant', () => {
    const { getByText } = render(
      <Button label="Annuler" variant="secondary" onPress={() => {}} />,
    );
    expect(getByText('Annuler')).toBeTruthy();
  });
});
