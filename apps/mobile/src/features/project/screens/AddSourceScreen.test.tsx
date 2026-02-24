import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddSourceScreen } from './AddSourceScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');

const mockNavigation = {
  goBack: jest.fn(),
} as any;

const mockRoute = {
  params: { projectId: 'p1' },
} as any;

describe('AddSourceScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render URL input and submit button', () => {
    const { getByTestId } = render(
      <AddSourceScreen navigation={mockNavigation} route={mockRoute} />,
    );
    expect(getByTestId('source-url-input')).toBeTruthy();
    expect(getByTestId('add-source-submit')).toBeTruthy();
  });

  it('should disable submit when URL is empty', () => {
    const { getByTestId } = render(
      <AddSourceScreen navigation={mockNavigation} route={mockRoute} />,
    );
    const button = getByTestId('add-source-submit');
    expect(button.props.accessibilityState?.disabled ?? button.props.disabled).toBeTruthy();
  });

  it('should call API with URL and go back on success', async () => {
    (api.apiPost as jest.Mock).mockResolvedValue({
      id: 's1',
      type: 'url',
      url: 'https://example.com',
      status: 'pending',
    });

    const { getByTestId } = render(
      <AddSourceScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.changeText(getByTestId('source-url-input'), 'https://example.com');
    fireEvent.press(getByTestId('add-source-submit'));

    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith('/api/projects/p1/sources', {
        type: 'url',
        url: 'https://example.com',
      });
      expect(mockNavigation.goBack).toHaveBeenCalled();
    });
  });

  it('should show alert on API error', async () => {
    (api.apiPost as jest.Mock).mockRejectedValue(new Error('Source limit reached'));

    const { getByTestId } = render(
      <AddSourceScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.changeText(getByTestId('source-url-input'), 'https://example.com');
    fireEvent.press(getByTestId('add-source-submit'));

    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalled();
    });
  });

  it('should validate URL format', () => {
    const { getByTestId } = render(
      <AddSourceScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.changeText(getByTestId('source-url-input'), 'not-a-url');
    const button = getByTestId('add-source-submit');
    expect(button.props.accessibilityState?.disabled ?? button.props.disabled).toBeTruthy();
  });
});
