import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ShareScreen } from './ShareScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');

const mockNavigation = {
  goBack: jest.fn(),
} as any;

const mockRoute = {
  params: { projectId: 'p1' },
} as any;

describe('ShareScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show share button', async () => {
    (api.apiPost as jest.Mock).mockResolvedValue({
      slug: 'abc123',
      isActive: true,
    });

    const { getByTestId } = render(
      <ShareScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('create-share-link')).toBeTruthy();
    });
  });

  it('should call share API and display link', async () => {
    (api.apiPost as jest.Mock).mockResolvedValue({
      slug: 'abc123',
      isActive: true,
    });

    const { getByTestId, getByText } = render(
      <ShareScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.press(getByTestId('create-share-link'));

    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith('/api/projects/p1/share');
      expect(getByText(/abc123/)).toBeTruthy();
    });
  });

  it('should show copy button after link is generated', async () => {
    (api.apiPost as jest.Mock).mockResolvedValue({
      slug: 'abc123',
      isActive: true,
    });

    const { getByTestId } = render(
      <ShareScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.press(getByTestId('create-share-link'));

    await waitFor(() => {
      expect(getByTestId('copy-link-button')).toBeTruthy();
    });
  });
});
