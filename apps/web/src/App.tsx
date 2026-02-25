import { useState, useEffect } from 'react';
import { fetchSharedPodcast, type SharedPodcast } from './api';
import { Player } from './components/Player';

function getSlug(): string | null {
  const path = window.location.pathname.replace(/^\//, '');
  return path || null;
}

export function App() {
  const [slug] = useState(getSlug);
  const [podcast, setPodcast] = useState<SharedPodcast | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setLoading(false);
      return;
    }

    fetchSharedPodcast(slug)
      .then(setPodcast)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container">
        <div className="centered">
          <div className="spinner" />
          <p>Chargement du podcast...</p>
        </div>
      </div>
    );
  }

  if (!slug) {
    return (
      <div className="container">
        <div className="centered">
          <h2>Zeste</h2>
          <p>Ouvrez un lien de partage pour écouter un podcast.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="centered">
          <h2>Oups</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!podcast) return null;

  return <Player podcast={podcast} />;
}
