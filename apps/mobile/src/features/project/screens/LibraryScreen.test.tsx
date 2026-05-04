import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { LibraryScreen } from './LibraryScreen';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');

const navigation = {
  navigate: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
  setOptions: jest.fn(),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const route = {} as any;

beforeEach(() => {
  jest.clearAllMocks();
});

describe('LibraryScreen', () => {
  it('renders the library hero', () => {
    (api.apiGet as jest.Mock).mockReturnValue(new Promise(() => {}));
    const { getByText } = render(
      <LibraryScreen navigation={navigation} route={route} />,
    );
    expect(getByText(/bibliothèque/i)).toBeTruthy();
  });

  it('renders the empty state with 3 suggestion cards when there are no projects', async () => {
    (api.apiGet as jest.Mock).mockResolvedValueOnce([]);

    const { findByTestId } = render(
      <LibraryScreen navigation={navigation} route={route} />,
    );

    await findByTestId('library-empty-url');
    await findByTestId('library-empty-pdf');
    await findByTestId('library-empty-text');
  });

  it('renders projects as ListRow items once loaded', async () => {
    (api.apiGet as jest.Mock).mockResolvedValueOnce([
      { id: 'p1', name: 'L IA en 2026', status: 'ready', tone: 'debate', targetDuration: 14, chapterCount: 3 },
      { id: 'p2', name: 'Tech daily', status: 'processing', tone: 'pedagogue', targetDuration: 10, chapterCount: 2 },
    ]);

    const { findByText } = render(
      <LibraryScreen navigation={navigation} route={route} />,
    );

    await findByText('L IA en 2026');
    await findByText('Tech daily');
  });

  it('navigates to Compose when the FAB is pressed', async () => {
    (api.apiGet as jest.Mock).mockResolvedValueOnce([]);

    const { findByTestId } = render(
      <LibraryScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(await findByTestId('library-fab'));

    expect(navigation.navigate).toHaveBeenCalledWith('Compose');
  });

  it('routes to Player for a ready project', async () => {
    (api.apiGet as jest.Mock).mockResolvedValueOnce([
      { id: 'p1', name: 'Ready episode', status: 'ready', tone: 'pedagogue', targetDuration: 10, chapterCount: 2 },
    ]);

    const { findByText } = render(
      <LibraryScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(await findByText('Ready episode'));

    expect(navigation.navigate).toHaveBeenCalledWith('Player', { projectId: 'p1' });
  });

  it('routes to Generating for a processing project', async () => {
    (api.apiGet as jest.Mock).mockResolvedValueOnce([
      { id: 'p1', name: 'Brewing soon', status: 'processing', tone: 'interview', targetDuration: 10, chapterCount: 2 },
    ]);

    const { findByText } = render(
      <LibraryScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(await findByText('Brewing soon'));

    expect(navigation.navigate).toHaveBeenCalledWith('Generating', { projectId: 'p1', tone: 'interview' });
  });

  it('routes to Compose with projectId for a draft project', async () => {
    (api.apiGet as jest.Mock).mockResolvedValueOnce([
      { id: 'p1', name: 'Draft thoughts', status: 'draft', tone: null, targetDuration: 0, chapterCount: 0 },
    ]);

    const { findByText } = render(
      <LibraryScreen navigation={navigation} route={route} />,
    );

    fireEvent.press(await findByText('Draft thoughts'));

    expect(navigation.navigate).toHaveBeenCalledWith('Compose', { projectId: 'p1' });
  });

  it('shows the EN COURS eyebrow when at least one project is generating', async () => {
    (api.apiGet as jest.Mock).mockResolvedValueOnce([
      { id: 'p1', name: 'X', status: 'processing', tone: 'pedagogue', targetDuration: 10, chapterCount: 2 },
    ]);

    const { findByText } = render(
      <LibraryScreen navigation={navigation} route={route} />,
    );

    await findByText(/en cours/i);
  });
});
