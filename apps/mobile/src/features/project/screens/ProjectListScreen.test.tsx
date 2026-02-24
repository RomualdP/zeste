import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ProjectListScreen } from './ProjectListScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');

const mockNavigation = {
  navigate: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
} as any;

const mockRoute = {} as any;

describe('ProjectListScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show loading state initially', () => {
    (api.apiGet as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { getByText } = render(
      <ProjectListScreen navigation={mockNavigation} route={mockRoute} />,
    );
    expect(getByText('Chargement...')).toBeTruthy();
  });

  it('should display projects after loading', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([
      { id: '1', name: 'Projet A', status: 'draft' },
      { id: '2', name: 'Projet B', status: 'ready' },
    ]);

    const { getByText } = render(
      <ProjectListScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByText('Projet A')).toBeTruthy();
      expect(getByText('Projet B')).toBeTruthy();
    });
  });

  it('should show empty message when no projects', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([]);

    const { getByText } = render(
      <ProjectListScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      expect(getByText('Aucun projet. Créez-en un !')).toBeTruthy();
    });
  });

  it('should navigate to CreateProject on FAB press', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([]);

    const { getByTestId } = render(
      <ProjectListScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      fireEvent.press(getByTestId('create-project-button'));
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('CreateProject');
  });

  it('should navigate to ProjectDetail on project press', async () => {
    (api.apiGet as jest.Mock).mockResolvedValue([
      { id: 'p1', name: 'Mon Podcast', status: 'draft' },
    ]);

    const { getByTestId } = render(
      <ProjectListScreen navigation={mockNavigation} route={mockRoute} />,
    );

    await waitFor(() => {
      fireEvent.press(getByTestId('project-p1'));
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('ProjectDetail', { projectId: 'p1' });
  });
});
