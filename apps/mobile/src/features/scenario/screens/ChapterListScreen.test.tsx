import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ChapterListScreen } from './ChapterListScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');

const mockNavigation = {
  navigate: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
} as any;

const mockRoute = {
  params: { projectId: 'p1' },
} as any;

describe('ChapterListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    (api.apiGet as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { getByText } = render(
      <ChapterListScreen navigation={mockNavigation} route={mockRoute} />,
    );
    expect(getByText('Chargement...')).toBeTruthy();
  });

  it('should display chapters after loading', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([
      { id: 'c1', title: 'Introduction', summary: 'Résumé intro', position: 0, status: 'draft' },
      { id: 'c2', title: 'Chapitre 1', summary: 'Résumé ch1', position: 1, status: 'draft' },
    ]);

    const { getByText } = render(
      <ChapterListScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByText('Introduction')).toBeTruthy();
      expect(getByText('Chapitre 1')).toBeTruthy();
      expect(getByText('Résumé intro')).toBeTruthy();
    });
  });

  it('should show empty state when no chapters', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <ChapterListScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByText('Aucun chapitre')).toBeTruthy();
    });
  });

  it('should show generate plan button when no chapters', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([]);

    const { getByTestId } = render(
      <ChapterListScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('generate-plan-button')).toBeTruthy();
    });
  });

  it('should call generate plan API on button press', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([]);
    (api.apiPost as jest.Mock).mockResolvedValue([
      { id: 'c1', title: 'Generated Chapter', summary: 'Summary', position: 0, status: 'draft' },
    ]);

    const { getByTestId, getByText } = render(
      <ChapterListScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('generate-plan-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('generate-plan-button'));

    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith('/api/projects/p1/generate-plan');
      expect(getByText('Generated Chapter')).toBeTruthy();
    });
  });

  it('should show generate scenario button when chapters exist', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([
      { id: 'c1', title: 'Introduction', summary: 'Résumé', position: 0, status: 'draft' },
    ]);

    const { getByTestId } = render(
      <ChapterListScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('generate-scenario-button')).toBeTruthy();
    });
  });

  it('should call generate scenario API on button press', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([
      { id: 'c1', title: 'Introduction', summary: 'Résumé', position: 0, status: 'draft' },
    ]);
    (api.apiPost as jest.Mock).mockResolvedValue([
      { id: 'c1', title: 'Introduction', summary: 'Résumé', position: 0, status: 'scripted' },
    ]);

    const { getByTestId } = render(
      <ChapterListScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByTestId('generate-scenario-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('generate-scenario-button'));

    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith('/api/projects/p1/generate');
    });
  });
});
