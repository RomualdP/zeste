export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainStackParamList = {
  Library: undefined;
  ProjectDetail: { projectId: string };
  Compose: { projectId?: string } | undefined;
  Generating: { projectId: string };
  ChapterList: { projectId: string };
  Player: { projectId: string };
  Share: { projectId: string };
};
