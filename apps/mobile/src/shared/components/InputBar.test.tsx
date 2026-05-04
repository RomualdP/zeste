import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { InputBar } from './InputBar';

describe('InputBar', () => {
  it('renders the placeholder', () => {
    const { getByPlaceholderText } = render(
      <InputBar value="" onChangeText={() => {}} onSubmit={() => {}} placeholder="ton@email.com" />,
    );

    expect(getByPlaceholderText('ton@email.com')).toBeTruthy();
  });

  it('emits typed text via onChangeText', () => {
    const onChangeText = jest.fn();
    const { getByPlaceholderText } = render(
      <InputBar value="" onChangeText={onChangeText} onSubmit={() => {}} placeholder="say it" />,
    );

    fireEvent.changeText(getByPlaceholderText('say it'), 'hello');

    expect(onChangeText).toHaveBeenCalledWith('hello');
  });

  it('calls onSubmit when the submit button is pressed', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <InputBar value="hello" onChangeText={() => {}} onSubmit={onSubmit} placeholder="say it" />,
    );

    fireEvent.press(getByTestId('input-bar-submit'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not submit when value is empty (whitespace only)', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <InputBar value="   " onChangeText={() => {}} onSubmit={onSubmit} placeholder="say it" />,
    );

    fireEvent.press(getByTestId('input-bar-submit'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('respects an explicit submitDisabled flag even with non-empty value', () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render(
      <InputBar
        value="ok"
        onChangeText={() => {}}
        onSubmit={onSubmit}
        placeholder="say it"
        submitDisabled
      />,
    );

    fireEvent.press(getByTestId('input-bar-submit'));

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
