import { useState, useRef, useEffect, useCallback } from 'react';
import type { SharedPodcast } from '../api';
import { Icons } from './Icons';

function formatDuration(seconds: number | null): string {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDurationMs(ms: number | null): string {
  if (!ms) return '--:--';
  return formatDuration(ms / 1000);
}

const TONE_LABELS: Record<string, string> = {
  pedagogue: 'Pédagogue',
  debate: 'Débat',
  vulgarization: 'Vulgarisation',
  interview: 'Interview',
};

interface Props {
  podcast: SharedPodcast;
}

export function Player({ podcast }: Props) {
  const { project, chapters } = podcast;
  const playableChapters = chapters.filter((c) => c.audioUrl);

  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const currentChapter = playableChapters[currentIndex];

  const play = useCallback(async () => {
    if (audioRef.current) {
      await audioRef.current.play();
      setIsPlaying(true);
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const playChapter = useCallback((index: number) => {
    setCurrentIndex(index);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);
  }, []);

  const prev = useCallback(() => {
    if (currentIndex > 0) {
      playChapter(currentIndex - 1);
    }
  }, [currentIndex, playChapter]);

  const next = useCallback(() => {
    if (currentIndex < playableChapters.length - 1) {
      playChapter(currentIndex + 1);
    }
  }, [currentIndex, playableChapters.length, playChapter]);

  // Load audio when chapter changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentChapter?.audioUrl) return;

    audio.src = currentChapter.audioUrl;
    audio.load();

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, currentChapter?.audioUrl]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (currentIndex < playableChapters.length - 1) {
        playChapter(currentIndex + 1);
      } else {
        setIsPlaying(false);
      }
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [currentIndex, playableChapters.length, playChapter]);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audio.currentTime = ratio * duration;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const totalDuration = chapters.reduce((sum, ch) => sum + (ch.audioDuration ?? 0), 0);

  return (
    <div className="container">
      <audio ref={audioRef} preload="auto" />

      <div className="header">
        <div className="brand">Zeste</div>
        <h1>{project.name}</h1>
        <div className="meta">
          <span className="tag">{TONE_LABELS[project.tone] ?? project.tone}</span>
          <span>{chapters.length} chapitre{chapters.length > 1 ? 's' : ''}</span>
          {totalDuration > 0 && <span>{formatDurationMs(totalDuration)}</span>}
        </div>
      </div>

      <div className="chapter-list">
        {chapters.map((chapter) => {
          const playableIndex = playableChapters.findIndex((c) => c.id === chapter.id);
          const isActive = playableIndex === currentIndex && playableIndex >= 0;
          const isCurrentlyPlaying = isActive && isPlaying;
          const hasAudio = !!chapter.audioUrl;

          return (
            <div
              key={chapter.id}
              className={`chapter-item${isActive ? ' active' : ''}${isCurrentlyPlaying ? ' playing' : ''}`}
              onClick={() => hasAudio && playableIndex >= 0 && playChapter(playableIndex)}
              style={{ opacity: hasAudio ? 1 : 0.5, cursor: hasAudio ? 'pointer' : 'default' }}
            >
              <div className="chapter-index">
                {isCurrentlyPlaying ? (
                  <Icons.SoundWave />
                ) : (
                  chapter.position + 1
                )}
              </div>
              <div className="chapter-info">
                <div className="chapter-title">{chapter.title}</div>
                {chapter.summary && (
                  <div className="chapter-summary">{chapter.summary}</div>
                )}
              </div>
              <div className="chapter-duration">
                {formatDurationMs(chapter.audioDuration)}
              </div>
            </div>
          );
        })}
      </div>

      {playableChapters.length > 0 && (
        <div className="player-bar">
          <div className="player-progress" onClick={handleProgressClick}>
            <div className="player-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="player-content">
            <div className="player-info">
              <div className="player-title">{currentChapter?.title ?? '---'}</div>
              <div className="player-time">
                {formatDuration(currentTime)} / {formatDuration(duration)}
              </div>
            </div>
            <div className="player-controls">
              <button
                className="player-btn"
                onClick={prev}
                disabled={currentIndex === 0}
                aria-label="Chapitre précédent"
              >
                <Icons.Prev />
              </button>
              <button
                className="player-btn play"
                onClick={isPlaying ? pause : play}
                aria-label={isPlaying ? 'Pause' : 'Lecture'}
              >
                {isPlaying ? <Icons.Pause /> : <Icons.Play />}
              </button>
              <button
                className="player-btn"
                onClick={next}
                disabled={currentIndex >= playableChapters.length - 1}
                aria-label="Chapitre suivant"
              >
                <Icons.Next />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
