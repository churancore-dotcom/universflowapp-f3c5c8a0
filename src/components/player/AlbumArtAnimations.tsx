import { memo } from 'react';

interface AlbumArtAnimationsProps {
  isPlaying: boolean;
  bassFrequency: number;
  midFrequency: number;
  highFrequency: number;
  songId: string;
}

// Simplified, performance-optimized album art glow
const AlbumArtAnimations = memo(function AlbumArtAnimations({
  isPlaying,
  bassFrequency,
}: AlbumArtAnimationsProps) {
  if (!isPlaying) return null;

  // Simple static glow - no complex animations
  const glowIntensity = 0.2 + bassFrequency * 0.3;

  return (
    <div
      className="absolute inset-[-20%] rounded-3xl pointer-events-none"
      style={{
        background: `radial-gradient(circle, hsl(var(--primary) / ${glowIntensity}) 0%, transparent 60%)`,
        filter: 'blur(40px)',
        opacity: 0.8,
      }}
    />
  );
});

export default AlbumArtAnimations;
