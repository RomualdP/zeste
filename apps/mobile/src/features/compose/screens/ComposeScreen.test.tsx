import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ComposeScreen } from './ComposeScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');

const mockedPost = api.apiPost as jest.Mock;
const mockedPatch = api.apiPatch as jest.Mock;

const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const route = { params: undefined } as any;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ComposeScreen', () => {
  it('renders the greeting bubble and the name input on first render', () => {
    const { getByText, getByPlaceholderText } = render(
      <ComposeScreen navigation={navigation} route={route} />,
    );

    expect(getByText(/On commence par un nom/i)).toBeTruthy();
    expect(getByPlaceholderText('Donne-lui un titre')).toBeTruthy();
  });

  it('moves to the sources phase after submitting the name', async () => {
    mockedPost.mockResolvedValueOnce({ id: 'p-1', name: 'My Episode' });

    const { getByPlaceholderText, getByTestId, findByText } = render(
      <ComposeScreen navigation={navigation} route={route} />,
    );

    fireEvent.changeText(getByPlaceholderText('Donne-lui un titre'), 'My Episode');
    fireEvent.press(getByTestId('input-bar-submit'));

    await findByText(/colle tes sources/i);
    expect(api.apiPost).toHaveBeenCalledWith('/api/projects', { name: 'My Episode' });
  });

  it('adds a source and reveals the continue CTA', async () => {
    mockedPost
      .mockResolvedValueOnce({ id: 'p-1', name: 'X' })
      .mockResolvedValueOnce({ id: 's-1', type: 'url', value: 'https://x.fr' });

    const { getByPlaceholderText, getByTestId, findByPlaceholderText, findByTestId } = render(
      <ComposeScreen navigation={navigation} route={route} />,
    );

    fireEvent.changeText(getByPlaceholderText('Donne-lui un titre'), 'X');
    fireEvent.press(getByTestId('input-bar-submit'));

    const sourceInput = await findByPlaceholderText(/coller une url/i);
    fireEvent.changeText(sourceInput, 'https://x.fr');
    fireEvent.press(getByTestId('input-bar-submit'));

    await findByTestId('compose-continue-sources');
  });

  it('navigates to Generating after the user submits the configuration', async () => {
    mockedPost
      .mockResolvedValueOnce({ id: 'p-1', name: 'X' })
      .mockResolvedValueOnce({ id: 's-1', type: 'url', value: 'https://x.fr' });
    mockedPatch.mockResolvedValueOnce({ id: 'p-1' });

    const { getByPlaceholderText, getByTestId, findByPlaceholderText, findByTestId } = render(
      <ComposeScreen navigation={navigation} route={route} />,
    );

    fireEvent.changeText(getByPlaceholderText('Donne-lui un titre'), 'X');
    fireEvent.press(getByTestId('input-bar-submit'));

    const sourceInput = await findByPlaceholderText(/coller une url/i);
    fireEvent.changeText(sourceInput, 'https://x.fr');
    fireEvent.press(getByTestId('input-bar-submit'));

    fireEvent.press(await findByTestId('compose-continue-sources'));

    const toneCard = await findByTestId('compose-tone-card-pedagogue');
    fireEvent.press(toneCard);

    mockedPost.mockResolvedValueOnce({ jobId: 'job-1' });
    fireEvent.press(await findByTestId('compose-launch'));

    await waitFor(() => {
      expect(api.apiPatch).toHaveBeenCalledWith(
        '/api/projects/p-1/configure',
        expect.objectContaining({ tone: 'pedagogue' }),
      );
      expect(navigation.navigate).toHaveBeenCalledWith('Generating', {
        projectId: 'p-1',
        tone: 'pedagogue',
      });
    });
  });
});
