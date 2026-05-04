import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PlayerScreen } from './PlayerScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');

const mockNavigation = {
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
} as any;

const mockRoute = {
  params: { projectId: 'p1' },
} as any;

const baseProject = {
  id: 'p1',
  userId: 'u1',
  name: 'Mon Podcast',
  tone: 'pedagogue',
  targetDuration: 15,
  chapterCount: 2,
  status: 'ready',
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
};

function mockApi({
  project = baseProject,
  chapters = [] as any[],
  sources = [] as any[],
}: {
  project?: any;
  chapters?: any[];
  sources?: any[];
} = {}) {
  (api.apiGet as jest.Mock).mockImplementation((path: string) => {
    if (path === `/api/projects/p1`) return Promise.resolve(project);
    if (path === `/api/projects/p1/chapters`) return Promise.resolve(chapters);
    if (path === `/api/projects/p1/sources`) return Promise.resolve(sources);
    if (path.includes('/audio')) return Promise.resolve({ url: 'https://x/audio.mp3' });
    return Promise.resolve(null);
  });
}

describe('PlayerScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    (api.apiGet as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { getByText } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );
    expect(getByText('Chargement…')).toBeTruthy();
  });

  it('should display chapters playlist after loading', async () => {
    mockApi({
      chapters: [
        { id: 'c1', projectId: 'p1', title: 'Introduction', summary: '', status: 'ready', position: 0, audioPath: 'p1/c1.mp3', audioDuration: 60, script: [] },
        { id: 'c2', projectId: 'p1', title: 'Chapitre 1', summary: '', status: 'ready', position: 1, audioPath: 'p1/c2.mp3', audioDuration: 60, script: [] },
      ],
    });

    const { getAllByText, getByText } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getAllByText('Introduction').length).toBeGreaterThanOrEqual(1);
      expect(getByText('Chapitre 1')).toBeTruthy();
    });
  });

  it('should show current chapter title', async () => {
    mockApi({
      chapters: [
        { id: 'c1', projectId: 'p1', title: 'Introduction', summary: '', status: 'ready', position: 0, audioPath: 'p1/c1.mp3', audioDuration: 60, script: [] },
      ],
    });

    const { getByTestId } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('current-chapter-title')).toBeTruthy();
    });
  });

  it('should show play/pause button', async () => {
    mockApi({
      chapters: [
        { id: 'c1', projectId: 'p1', title: 'Introduction', summary: '', status: 'ready', position: 0, audioPath: 'p1/c1.mp3', audioDuration: 60, script: [] },
      ],
    });

    const { getByTestId } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('play-pause-button')).toBeTruthy();
    });
  });

  it('should show next/previous buttons', async () => {
    mockApi({
      chapters: [
        { id: 'c1', projectId: 'p1', title: 'Introduction', summary: '', status: 'ready', position: 0, audioPath: 'p1/c1.mp3', audioDuration: 60, script: [] },
        { id: 'c2', projectId: 'p1', title: 'Chapitre 1', summary: '', status: 'ready', position: 1, audioPath: 'p1/c2.mp3', audioDuration: 60, script: [] },
      ],
    });

    const { getByTestId } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('prev-button')).toBeTruthy();
      expect(getByTestId('next-button')).toBeTruthy();
    });
  });

  it('should show message when no audio chapters available', async () => {
    mockApi({
      chapters: [
        { id: 'c1', projectId: 'p1', title: 'Introduction', summary: '', status: 'draft', position: 0, audioPath: null, audioDuration: null, script: [] },
      ],
    });

    const { getByText } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByText('Aucun audio disponible')).toBeTruthy();
    });
  });

  it('switches content when tapping on Transcript and Sources tabs', async () => {
    mockApi({
      chapters: [
        {
          id: 'c1',
          projectId: 'p1',
          title: 'Introduction',
          summary: '',
          status: 'ready',
          position: 0,
          audioPath: 'p1/c1.mp3',
          audioDuration: 60,
          script: [
            { speaker: 'host', text: 'Bonjour à tous.', tone: 'neutral' },
            { speaker: 'expert', text: 'Merci pour l’invitation.', tone: 'neutral' },
          ],
        },
      ],
      sources: [
        {
          id: 's1',
          projectId: 'p1',
          type: 'url',
          url: 'https://lemonde.fr/ia',
          filePath: null,
          rawContent: '',
          status: 'ready',
          errorMessage: null,
          createdAt: '2026-05-04T00:00:00.000Z',
        },
      ],
    });

    const { getByTestId, queryByText, getByText } = render(
      <PlayerScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('player-tab-chapters')).toBeTruthy();
    });

    // Default = Chapitres tab: chapter is visible, transcript / source are not
    expect(queryByText('Bonjour à tous.')).toBeNull();
    expect(queryByText('https://lemonde.fr/ia')).toBeNull();

    // Switch to Transcript
    fireEvent.press(getByTestId('player-tab-transcript'));
    expect(getByText('Bonjour à tous.')).toBeTruthy();
    expect(getByText('Merci pour l’invitation.')).toBeTruthy();
    expect(queryByText('https://lemonde.fr/ia')).toBeNull();

    // Switch to Sources
    fireEvent.press(getByTestId('player-tab-sources'));
    expect(getByText('https://lemonde.fr/ia')).toBeTruthy();
    expect(queryByText('Bonjour à tous.')).toBeNull();
  });
});
