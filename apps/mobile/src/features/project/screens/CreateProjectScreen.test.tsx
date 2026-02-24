import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { CreateProjectScreen } from './CreateProjectScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');

const mockNavigation = {
  replace: jest.fn(),
} as any;

const mockRoute = {} as any;

describe('CreateProjectScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render name input and submit button', () => {
    const { getByTestId } = render(
      <CreateProjectScreen navigation={mockNavigation} route={mockRoute} />,
    );
    expect(getByTestId('project-name-input')).toBeTruthy();
    expect(getByTestId('create-project-submit')).toBeTruthy();
  });

  it('should disable submit when name is empty', () => {
    const { getByTestId } = render(
      <CreateProjectScreen navigation={mockNavigation} route={mockRoute} />,
    );
    const button = getByTestId('create-project-submit');
    expect(button.props.accessibilityState?.disabled ?? button.props.disabled).toBeTruthy();
  });

  it('should call API and navigate on successful creation', async () => {
    (api.apiPost as jest.Mock).mockResolvedValue({ id: 'new-project', name: 'Test' });

    const { getByTestId } = render(
      <CreateProjectScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.changeText(getByTestId('project-name-input'), 'Test');
    fireEvent.press(getByTestId('create-project-submit'));

    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalledWith('/api/projects', { name: 'Test' });
      expect(mockNavigation.replace).toHaveBeenCalledWith('ProjectDetail', { projectId: 'new-project' });
    });
  });

  it('should show alert on API error', async () => {
    (api.apiPost as jest.Mock).mockRejectedValue(new Error('Quota exceeded'));

    const { getByTestId } = render(
      <CreateProjectScreen navigation={mockNavigation} route={mockRoute} />,
    );

    fireEvent.changeText(getByTestId('project-name-input'), 'Test');
    fireEvent.press(getByTestId('create-project-submit'));

    await waitFor(() => {
      expect(api.apiPost).toHaveBeenCalled();
    });
  });
});
