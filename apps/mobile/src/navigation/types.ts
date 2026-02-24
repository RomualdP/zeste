export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainStackParamList = {
  ProjectList: undefined;
  CreateProject: undefined;
  ProjectDetail: { projectId: string };
  AddSource: { projectId: string };
  Configure: { projectId: string };
  ChapterList: { projectId: string };
};
