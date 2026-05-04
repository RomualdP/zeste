jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn(),
}));

jest.mock('react-native-gesture-handler', () => {
  const actual = jest.requireActual('react-native');
  return {
    GestureHandlerRootView: actual.View,
    gestureHandlerRootHOC: (c: unknown) => c,
    Gesture: {},
    GestureDetector: ({ children }: { children: unknown }) => children,
    State: {},
  };
});

jest.mock('react-native-reanimated', () => {
  const actual = jest.requireActual('react-native');
  return {
    __esModule: true,
    default: { View: actual.View, Text: actual.Text, ScrollView: actual.ScrollView },
    View: actual.View,
    Text: actual.Text,
    ScrollView: actual.ScrollView,
    useAnimatedStyle: () => ({}),
    useSharedValue: (v: unknown) => ({ value: v }),
    useAnimatedScrollHandler: () => () => {},
    withTiming: (v: unknown) => v,
    withSpring: (v: unknown) => v,
    interpolate: () => 0,
    Extrapolate: { CLAMP: 'clamp' },
    Easing: {
      bezier: () => () => 0,
      linear: () => 0,
      ease: () => 0,
      out: () => () => 0,
      in: () => () => 0,
    },
  };
});

jest.mock('@gorhom/bottom-sheet', () => {
  const React = jest.requireActual('react');
  const RN = jest.requireActual('react-native');

  const BottomSheetModal = React.forwardRef(
    ({ children }: { children: React.ReactNode }, ref: React.Ref<unknown>) => {
      const [visible, setVisible] = React.useState(false);
      React.useImperativeHandle(ref, () => ({
        present: () => setVisible(true),
        dismiss: () => setVisible(false),
      }));
      if (!visible) return null;
      return React.createElement(RN.View, { testID: 'bottom-sheet-modal' }, children);
    },
  );

  return {
    __esModule: true,
    default: BottomSheetModal,
    BottomSheetModal,
    BottomSheetModalProvider: ({ children }: { children: React.ReactNode }) => children,
    BottomSheetView: RN.View,
    BottomSheetScrollView: RN.ScrollView,
    BottomSheetBackdrop: RN.View,
  };
});

jest.mock('expo-audio', () => ({
  useAudioPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    replace: jest.fn(),
    remove: jest.fn(),
  })),
  useAudioPlayerStatus: jest.fn(() => ({
    playing: false,
    isLoaded: false,
    isBuffering: false,
    currentTime: 0,
    duration: 0,
    didJustFinish: false,
  })),
  setAudioModeAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('./shared/services/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: { access_token: 'test-token' } },
      }),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));
