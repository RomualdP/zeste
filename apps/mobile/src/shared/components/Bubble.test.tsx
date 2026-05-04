import React from 'react';
import { Text } from 'react-native';
import { render } from '@testing-library/react-native';
import { Bubble } from './Bubble';

describe('Bubble', () => {
  it('renders children content', () => {
    const { getByText } = render(
      <Bubble from="app">
        <Text>Hello 👋</Text>
      </Bubble>,
    );
    expect(getByText('Hello 👋')).toBeTruthy();
  });

  it('renders an app bubble (default left side)', () => {
    const { getByText } = render(
      <Bubble from="app">
        <Text>app message</Text>
      </Bubble>,
    );
    expect(getByText('app message')).toBeTruthy();
  });

  it('renders a user bubble', () => {
    const { getByText } = render(
      <Bubble from="user">
        <Text>user reply</Text>
      </Bubble>,
    );
    expect(getByText('user reply')).toBeTruthy();
  });

  it('accepts a delay prop without throwing', () => {
    expect(() =>
      render(
        <Bubble from="app" delay={200}>
          <Text>delayed</Text>
        </Bubble>,
      ),
    ).not.toThrow();
  });
});
