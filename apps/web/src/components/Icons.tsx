export const Icons = {
  Play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),

  Pause: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  ),

  Prev: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
    </svg>
  ),

  Next: () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  ),

  SoundWave: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <rect x="4" y="10" width="3" height="4" rx="1">
        <animate attributeName="height" values="4;12;4" dur="0.8s" repeatCount="indefinite" />
        <animate attributeName="y" values="10;6;10" dur="0.8s" repeatCount="indefinite" />
      </rect>
      <rect x="10.5" y="8" width="3" height="8" rx="1">
        <animate attributeName="height" values="8;4;8" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
        <animate attributeName="y" values="8;10;8" dur="0.8s" repeatCount="indefinite" begin="0.2s" />
      </rect>
      <rect x="17" y="9" width="3" height="6" rx="1">
        <animate attributeName="height" values="6;12;6" dur="0.8s" repeatCount="indefinite" begin="0.4s" />
        <animate attributeName="y" values="9;6;9" dur="0.8s" repeatCount="indefinite" begin="0.4s" />
      </rect>
    </svg>
  ),
};
