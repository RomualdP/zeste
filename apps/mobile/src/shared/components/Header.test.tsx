import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Header } from './Header';

describe('Header', () => {
  it('renders without back or menu when no callbacks are provided', () => {
    const { queryByTestId } = render(<Header />);

    expect(queryByTestId('header-back')).toBeNull();
    expect(queryByTestId('header-menu')).toBeNull();
  });

  it('renders a back button when onBack is provided', () => {
    const onBack = jest.fn();
    const { getByTestId } = render(<Header onBack={onBack} />);

    fireEvent.press(getByTestId('header-back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('renders a menu button when onMenu is provided', () => {
    const onMenu = jest.fn();
    const { getByTestId } = render(<Header onMenu={onMenu} />);

    fireEvent.press(getByTestId('header-menu'));

    expect(onMenu).toHaveBeenCalledTimes(1);
  });

  it('renders progress segments matching the total', () => {
    const { getAllByTestId } = render(<Header steps={{ total: 4, current: 2 }} />);

    expect(getAllByTestId(/^header-step-/)).toHaveLength(4);
  });
});
