import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { DetailScreen } from './DetailScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
} as any;

const baseRoute = { params: { projectId: 'p1' } } as any;

const baseProject = {
  id: 'p1',
  userId: 'u1',
  name: 'L’IA en 2026',
  tone: 'pedagogue',
  targetDuration: 15,
  chapterCount: 3,
  status: 'ready',
  createdAt: '2026-05-04T00:00:00.000Z',
  updatedAt: '2026-05-04T00:00:00.000Z',
};

function mockApi({
  project = baseProject,
  sources = [] as any[],
  shareLink = { slug: 'abc123', isActive: true },
}: {
  project?: any;
  sources?: any[];
  shareLink?: any;
} = {}) {
  (api.apiGet as jest.Mock).mockImplementation((path: string) => {
    if (path === '/api/projects/p1') return Promise.resolve(project);
    if (path === '/api/projects/p1/sources') return Promise.resolve(sources);
    return Promise.resolve(null);
  });
  (api.apiPost as jest.Mock).mockResolvedValue(shareLink);
  (api.apiDelete as jest.Mock).mockResolvedValue(undefined);
}

describe('DetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('shows a loading state initially', () => {
    (api.apiGet as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { getByText } = render(
      <DetailScreen navigation={mockNavigation} route={baseRoute} />,
    );
    expect(getByText('Chargement…')).toBeTruthy();
  });

  it('renders project name and the 3 primary CTAs after load', async () => {
    mockApi();
    const { getByTestId, getByText } = render(
      <DetailScreen navigation={mockNavigation} route={baseRoute} />,
    );

    await waitFor(() => {
      expect(getByText('L’IA en 2026')).toBeTruthy();
      expect(getByTestId('detail-listen-button')).toBeTruthy();
      expect(getByTestId('detail-share-button')).toBeTruthy();
      expect(getByTestId('detail-download-button')).toBeTruthy();
    });
  });

  it('navigates to Player when Écouter is tapped', async () => {
    mockApi();
    const { getByTestId } = render(
      <DetailScreen navigation={mockNavigation} route={baseRoute} />,
    );

    await waitFor(() => getByTestId('detail-listen-button'));
    fireEvent.press(getByTestId('detail-listen-button'));

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Player', { projectId: 'p1' });
  });

  it('opens the ShareSheet when Partager is tapped', async () => {
    mockApi();
    const { getByTestId, queryByTestId } = render(
      <DetailScreen navigation={mockNavigation} route={baseRoute} />,
    );

    await waitFor(() => getByTestId('detail-share-button'));
    expect(queryByTestId('bottom-sheet-modal')).toBeNull();

    fireEvent.press(getByTestId('detail-share-button'));

    await waitFor(() => {
      expect(getByTestId('bottom-sheet-modal')).toBeTruthy();
    });
  });

  it('renders sources and deletes one when its delete button is pressed', async () => {
    mockApi({
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

    const { getByTestId, getByText, queryByText } = render(
      <DetailScreen navigation={mockNavigation} route={baseRoute} />,
    );

    await waitFor(() => expect(getByText('https://lemonde.fr/ia')).toBeTruthy());

    fireEvent.press(getByTestId('delete-source-s1'));

    await waitFor(() => {
      expect(api.apiDelete).toHaveBeenCalledWith('/api/projects/p1/sources/s1');
      expect(queryByText('https://lemonde.fr/ia')).toBeNull();
    });
  });

  it('asks for confirmation before deleting the project', async () => {
    mockApi();
    const { getByTestId } = render(
      <DetailScreen navigation={mockNavigation} route={baseRoute} />,
    );

    await waitFor(() => getByTestId('detail-delete-project-button'));
    fireEvent.press(getByTestId('detail-delete-project-button'));

    expect(Alert.alert).toHaveBeenCalled();
    const args = (Alert.alert as jest.Mock).mock.calls[0];
    expect(args[0]).toMatch(/supprimer/i);
  });
});
