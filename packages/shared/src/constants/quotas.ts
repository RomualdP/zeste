export const QUOTAS = {
  FREE: {
    maxProjects: 3,
    maxSourcesPerProject: 3,
    maxPdfPages: 50,
    maxAudioDurationMinutes: 15,
  },
  PREMIUM: {
    maxProjects: 20,
    maxSourcesPerProject: 10,
    maxPdfPages: 200,
    maxAudioDurationMinutes: 30,
  },
} as const;
