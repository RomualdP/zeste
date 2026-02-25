import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PlayerScreen } from './PlayerScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');
jest.mock('../components/SoundWave', () => ({
  SoundWave: () => null,
}));

const mockNavigation = {
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
} as any;

const mockRoute = {
  params: { projectId: 'p1' },
} as any;

describe('PlayerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    (api.apiGet as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { getByText } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );
    expect(getByText('Chargement...')).toBeTruthy();
  });

  it('should display chapters playlist after loading', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([
      { id: 'c1', title: 'Introduction', status: 'ready', position: 0, audioPath: 'p1/c1.mp3', script: [] },
      { id: 'c2', title: 'Chapitre 1', status: 'ready', position: 1, audioPath: 'p1/c2.mp3', script: [] },
    ]);

    const { getAllByText, getByText } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getAllByText('Introduction').length).toBeGreaterThanOrEqual(1);
      expect(getByText('Chapitre 1')).toBeTruthy();
    });
  });

  it('should show current chapter title', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([
      { id: 'c1', title: 'Introduction', status: 'ready', position: 0, audioPath: 'p1/c1.mp3', script: [] },
    ]);

    const { getByTestId } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('current-chapter-title')).toBeTruthy();
    });
  });

  it('should show play/pause button', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([
      { id: 'c1', title: 'Introduction', status: 'ready', position: 0, audioPath: 'p1/c1.mp3', script: [] },
    ]);

    const { getByTestId } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('play-pause-button')).toBeTruthy();
    });
  });

  it('should show next/previous buttons', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([
      { id: 'c1', title: 'Introduction', status: 'ready', position: 0, audioPath: 'p1/c1.mp3', script: [] },
      { id: 'c2', title: 'Chapitre 1', status: 'ready', position: 1, audioPath: 'p1/c2.mp3', script: [] },
    ]);

    const { getByTestId } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('prev-button')).toBeTruthy();
      expect(getByTestId('next-button')).toBeTruthy();
    });
  });

  it('should show message when no audio chapters available', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([
      { id: 'c1', title: 'Introduction', status: 'draft', position: 0, audioPath: null, script: [] },
    ]);

    const { getByText } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByText('Aucun audio disponible')).toBeTruthy();
    });
  });

  it('should show progress bar', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([
      { id: 'c1', title: 'Introduction', status: 'ready', position: 0, audioPath: 'p1/c1.mp3', script: [] },
    ]);

    const { getAllByText } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      // Both position (0:00) and duration (0:00) are shown
      expect(getAllByText('0:00').length).toBe(2);
    });
  });
});
