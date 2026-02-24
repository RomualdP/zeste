import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProjectDetailScreen } from './ProjectDetailScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');

const mockNavigation = {
  navigate: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
} as any;

const baseRoute = {
  params: { projectId: 'p1' },
} as any;

describe('ProjectDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    (api.apiGet as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { getByText } = render(
      <ProjectDetailScreen navigation={mockNavigation} route={baseRoute} />,
    );
    expect(getByText('Chargement...')).toBeTruthy();
  });

  it('should display project details after loading', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce({
        id: 'p1',
        name: 'Mon Podcast',
        status: 'draft',
        tone: 'pedagogue',
        targetDuration: 15,
        chapterCount: 3,
      })
      .mockResolvedValueOnce([]);

    const { getByText } = render(
      <ProjectDetailScreen navigation={mockNavigation} route={baseRoute} />,
    );

    await waitFor(() => {
      expect(getByText('Mon Podcast')).toBeTruthy();
      expect(getByText('draft')).toBeTruthy();
    });
  });

  it('should show configure button for draft projects', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce({
        id: 'p1',
        name: 'Draft Project',
        status: 'draft',
        tone: 'pedagogue',
        targetDuration: 15,
        chapterCount: 3,
      })
      .mockResolvedValueOnce([]);

    const { getByTestId } = render(
      <ProjectDetailScreen navigation={mockNavigation} route={baseRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('configure-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('configure-button'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Configure', { projectId: 'p1' });
  });

  it('should show sources section', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce({
        id: 'p1',
        name: 'Mon Podcast',
        status: 'draft',
        tone: 'pedagogue',
        targetDuration: 15,
        chapterCount: 3,
      })
      .mockResolvedValueOnce([
        { id: 's1', type: 'url', url: 'https://example.com/article', status: 'ingested' },
      ]);

    const { getByText } = render(
      <ProjectDetailScreen navigation={mockNavigation} route={baseRoute} />,
    );

    await waitFor(() => {
      expect(getByText('Sources')).toBeTruthy();
      expect(getByText('https://example.com/article')).toBeTruthy();
    });
  });

  it('should show generate button when project has sources', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce({
        id: 'p1',
        name: 'Mon Podcast',
        status: 'draft',
        tone: 'pedagogue',
        targetDuration: 15,
        chapterCount: 3,
      })
      .mockResolvedValueOnce([
        { id: 's1', type: 'url', url: 'https://example.com', status: 'ingested' },
      ]);

    const { getByTestId } = render(
      <ProjectDetailScreen navigation={mockNavigation} route={baseRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('chapters-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('chapters-button'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ChapterList', { projectId: 'p1' });
  });

  it('should not show generate button when project has no sources', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce({
        id: 'p1',
        name: 'Mon Podcast',
        status: 'draft',
        tone: 'pedagogue',
        targetDuration: 15,
        chapterCount: 3,
      })
      .mockResolvedValueOnce([]);

    const { queryByTestId } = render(
      <ProjectDetailScreen navigation={mockNavigation} route={baseRoute} />,
    );

    await waitFor(() => {
      expect(queryByTestId('chapters-button')).toBeNull();
    });
  });

  it('should navigate to AddSource on add button press', async () => {
    (api.apiGet as jest.Mock)
      .mockResolvedValueOnce({
        id: 'p1',
        name: 'Mon Podcast',
        status: 'draft',
        tone: 'pedagogue',
        targetDuration: 15,
        chapterCount: 3,
      })
      .mockResolvedValueOnce([]);

    const { getByTestId } = render(
      <ProjectDetailScreen navigation={mockNavigation} route={baseRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('add-source-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('add-source-button'));
    expect(mockNavigation.navigate).toHaveBeenCalledWith('AddSource', { projectId: 'p1' });
  });
});
