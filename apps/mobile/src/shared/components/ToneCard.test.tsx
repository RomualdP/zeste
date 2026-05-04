import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ToneCard } from './ToneCard';

describe('ToneCard', () => {
  it('renders the label and description for a tone', () => {
    const { getByText } = render(
      <ToneCard toneId="pedagogue" selected={false} onPress={() => {}} />,
    );

    expect(getByText('Pédagogue')).toBeTruthy();
    expect(getByText('Comme un prof qui adore son sujet')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ToneCard toneId="debate" selected={false} onPress={onPress} />,
    );

    fireEvent.press(getByText('Débat'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders the 4 supported tones with their labels', () => {
    const cases = [
      { id: 'pedagogue', label: 'Pédagogue' },
      { id: 'debate', label: 'Débat' },
      { id: 'vulgarization', label: 'Vulgarisation' },
      { id: 'interview', label: 'Interview' },
    ] as const;

    cases.forEach(({ id, label }) => {
      const { getByText, unmount } = render(
        <ToneCard toneId={id} selected={false} onPress={() => {}} />,
      );
      expect(getByText(label)).toBeTruthy();
      unmount();
    });
  });

  it('renders selected and unselected variants', () => {
    const selected = render(
      <ToneCard toneId="interview" selected onPress={() => {}} />,
    );
    const unselected = render(
      <ToneCard toneId="interview" selected={false} onPress={() => {}} />,
    );

    expect(selected.getByText('Interview')).toBeTruthy();
    expect(unselected.getByText('Interview')).toBeTruthy();
  });
});
