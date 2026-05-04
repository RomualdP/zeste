import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ListRow } from './ListRow';

describe('ListRow', () => {
  it('renders title and meta', () => {
    const { getByText } = render(
      <ListRow
        toneId="pedagogue"
        title="L'IA en 2026"
        meta="3 chapitres · 14 min"
        onPress={() => {}}
      />,
    );

    expect(getByText("L'IA en 2026")).toBeTruthy();
    expect(getByText('3 chapitres · 14 min')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ListRow
        toneId="debate"
        title="Title"
        meta="meta"
        onPress={onPress}
      />,
    );

    fireEvent.press(getByText('Title'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('displays a generating dot when generating is true', () => {
    const { getByTestId, queryByTestId, rerender } = render(
      <ListRow
        toneId="interview"
        title="t"
        meta="m"
        generating
        onPress={() => {}}
      />,
    );

    expect(getByTestId('list-row-dot')).toBeTruthy();

    rerender(
      <ListRow
        toneId="interview"
        title="t"
        meta="m"
        onPress={() => {}}
      />,
    );

    expect(queryByTestId('list-row-dot')).toBeNull();
  });

  it('shows the avatar initial from the title', () => {
    const { getByText } = render(
      <ListRow
        toneId="vulgarization"
        title="hello world"
        meta="m"
        onPress={() => {}}
      />,
    );

    expect(getByText('H')).toBeTruthy();
  });
});
