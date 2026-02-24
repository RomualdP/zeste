export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainStackParamList = {
  ProjectList: undefined;
  CreateProject: undefined;
  ProjectDetail: { projectId: string };
  Configure: { projectId: string };
};
