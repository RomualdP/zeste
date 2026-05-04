import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { GeneratingScreen } from './GeneratingScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');
const mockedGet = api.apiGet as jest.Mock;
const mockedPost = api.apiPost as jest.Mock;

function makeProps(overrides: Partial<{ tone: string }> = {}) {
  const navigation = {
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  };
  const route = {
    params: { projectId: 'p-1', tone: overrides.tone ?? 'pedagogue' },
  };
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigation: navigation as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    route: route as any,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GeneratingScreen', () => {
  it('shows the plan label while phase=plan', async () => {
    mockedGet.mockResolvedValue({ phase: 'plan', progress: 0, error: null });
    const props = makeProps();

    const { findByText } = render(<GeneratingScreen {...props} />);

    await findByText(/On structure le/i);
  });

  it('shows the scenario label while phase=scenario', async () => {
    mockedGet.mockResolvedValue({ phase: 'scenario', progress: 0.33, error: null });
    const props = makeProps();

    const { findByText } = render(<GeneratingScreen {...props} />);

    await findByText(/On écrit le/i);
  });

  it('shows the audio label while phase=audio', async () => {
    mockedGet.mockResolvedValue({ phase: 'audio', progress: 0.66, error: null });
    const props = makeProps();

    const { findByText } = render(<GeneratingScreen {...props} />);

    await findByText(/On enregistre les/i);
  });

  it('navigates to Player when phase becomes ready', async () => {
    mockedGet.mockResolvedValue({ phase: 'ready', progress: 1, error: null });
    const props = makeProps();

    render(<GeneratingScreen {...props} />);

    await waitFor(() => {
      expect(props.navigation.replace).toHaveBeenCalledWith('Player', { projectId: 'p-1' });
    });
  });

  it('shows an error bubble and a retry button when phase=error', async () => {
    mockedGet.mockResolvedValue({ phase: 'error', progress: 0, error: 'Mistral timeout' });
    const props = makeProps();

    const { findByText, findByTestId } = render(<GeneratingScreen {...props} />);

    await findByText(/Mistral timeout/i);
    await findByTestId('generating-retry');
  });

  it('reposts /generate-full when retry is tapped', async () => {
    mockedGet.mockResolvedValueOnce({ phase: 'error', progress: 0, error: 'boom' });
    mockedPost.mockResolvedValueOnce({ jobId: 'job-2' });
    mockedGet.mockResolvedValueOnce({ phase: 'plan', progress: 0, error: null });
    const props = makeProps();

    const { findByTestId } = render(<GeneratingScreen {...props} />);

    fireEvent.press(await findByTestId('generating-retry'));

    await waitFor(() => {
      expect(mockedPost).toHaveBeenCalledWith('/api/projects/p-1/generate-full');
    });
  });

  it('navigates back to Library when "Continuer en arrière-plan" is tapped', async () => {
    mockedGet.mockResolvedValue({ phase: 'plan', progress: 0, error: null });
    const props = makeProps();

    const { findByTestId } = render(<GeneratingScreen {...props} />);

    fireEvent.press(await findByTestId('generating-background'));

    expect(props.navigation.navigate).toHaveBeenCalledWith('Library');
  });
});
