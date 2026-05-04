import React, { useRef } from 'react';
import { Pressable, Text } from 'react-native';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';
import { ShareSheet, ShareSheetHandle } from './ShareSheet';
import * as api from '../../../shared/services/api';

jest.mock('../../../shared/services/api');

function Harness({ projectId = 'p1' }: { projectId?: string }) {
  const ref = useRef<ShareSheetHandle>(null);
  return (
    <>
      <Pressable testID="open" onPress={() => ref.current?.present()}>
        <Text>open</Text>
      </Pressable>
      <Pressable testID="close" onPress={() => ref.current?.dismiss()}>
        <Text>close</Text>
      </Pressable>
      <ShareSheet ref={ref} projectId={projectId} />
    </>
  );
}

describe('ShareSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.apiPost as jest.Mock).mockResolvedValue({
      slug: 'abc123',
      isActive: true,
    });
  });

  it('is not visible until present() is called', () => {
    const { queryByTestId } = render(<Harness />);
    expect(queryByTestId('bottom-sheet-modal')).toBeNull();
  });

  it('opens and renders the share URL when present() is called', async () => {
    const { getByTestId, getByText } = render(<Harness />);

    fireEvent.press(getByTestId('open'));

    await waitFor(() => {
      expect(getByTestId('bottom-sheet-modal')).toBeTruthy();
      expect(getByText(/abc123/)).toBeTruthy();
    });
  });

  it('closes when dismiss() is called', async () => {
    const { getByTestId, queryByTestId } = render(<Harness />);

    fireEvent.press(getByTestId('open'));
    await waitFor(() => expect(getByTestId('bottom-sheet-modal')).toBeTruthy());

    fireEvent.press(getByTestId('close'));
    await waitFor(() => expect(queryByTestId('bottom-sheet-modal')).toBeNull());
  });

  it('copies URL to clipboard and shows confirmation when Copier is tapped', async () => {
    const { getByTestId, getByText } = render(<Harness />);

    fireEvent.press(getByTestId('open'));
    await waitFor(() => expect(getByText(/abc123/)).toBeTruthy());

    fireEvent.press(getByTestId('share-copy-button'));

    await waitFor(() => {
      expect(Clipboard.setStringAsync).toHaveBeenCalledTimes(1);
      const arg = (Clipboard.setStringAsync as jest.Mock).mock.calls[0][0];
      expect(arg).toContain('abc123');
      expect(getByText('Copié !')).toBeTruthy();
    });
  });
});
