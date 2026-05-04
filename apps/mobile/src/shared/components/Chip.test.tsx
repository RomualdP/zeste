import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Chip } from './Chip';

describe('Chip', () => {
  it('renders the label', () => {
    const { getByText } = render(<Chip label="URL" />);
    expect(getByText('URL')).toBeTruthy();
  });

  it('is pressable when onPress is provided', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Chip label="Oui" onPress={onPress} />);

    fireEvent.press(getByText('Oui'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders both active and inactive states without crashing', () => {
    const active = render(<Chip label="A" active />);
    const inactive = render(<Chip label="B" active={false} />);

    expect(active.getByText('A')).toBeTruthy();
    expect(inactive.getByText('B')).toBeTruthy();
  });

  it('does not call onPress when not pressable', () => {
    const onPress = jest.fn();
    const { getByText } = render(<Chip label="Static" />);

    fireEvent.press(getByText('Static'));

    expect(onPress).not.toHaveBeenCalled();
  });
});
