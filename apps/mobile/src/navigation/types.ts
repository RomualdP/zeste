export type AuthStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
};

export type MainStackParamList = {
  Library: undefined;
  Detail: { projectId: string };
  Compose: { projectId?: string } | undefined;
  Generating: { projectId: string };
  ChapterList: { projectId: string };
  Player: { projectId: string };
};
