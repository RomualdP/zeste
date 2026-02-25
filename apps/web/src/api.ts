const API_URL = import.meta.env.VITE_API_URL ?? 'https://zeste-production.up.railway.app';

interface SharedChapter {
  id: string;
  title: string;
  summary: string;
  position: number;
  audioPath: string | null;
  audioDuration: number | null;
  audioUrl: string | null;
}

interface SharedProject {
  id: string;
  name: string;
  tone: string;
  targetDuration: number;
}

export interface SharedPodcast {
  project: SharedProject;
  chapters: SharedChapter[];
}

export async function fetchSharedPodcast(slug: string): Promise<SharedPodcast> {
  const response = await fetch(`${API_URL}/api/shared/${slug}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Podcast introuvable');
    }
    throw new Error('Erreur lors du chargement');
  }

  const json = await response.json();
  return json.data as SharedPodcast;
}
