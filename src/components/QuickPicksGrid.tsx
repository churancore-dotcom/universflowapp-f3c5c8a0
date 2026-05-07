import { memo, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Music2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Song, usePlayer } from '@/contexts/PlayerContext';
import { useDownloads } from '@/contexts/DownloadContext';
import { triggerHaptic } from '@/hooks/useHaptics';

/**
 * Spotify-style "Jump back in" 2-column quick chips.
 * Pulls from recently_played; shows up to 8 (4 rows × 2 columns).
 * Each chip = small left-side cover + title, tap to play.
 */
const QuickPicksGrid = memo(function QuickPicksGrid() {
  const { user } = useAuth();
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const { getDownloadedUrl } = useDownloads();
  const [items, setItems] = useState<Song[]>([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('recently_played')
        .select('played_at, songs(id, title, artist, album, cover_url, audio_url, duration, artist_id)')
        .eq('user_id', user.id)
        .order('played_at', { ascending: false })
        .limit(20);

      if (!data || cancelled) return;
      const seen = new Set<string>();
      const unique: Song[] = [];
      for (const row of data as any[]) {
        const s = row.songs;
        if (!s || seen.has(s.id)) continue;
        seen.add(s.id);
        unique.push({
          id: s.id,
          title: s.title,
          artist: s.artist,
          album: s.album || undefined,
          cover_url: s.cover_url || undefined,
          audio_url: s.audio_url,
          duration: s.duration || undefined,
          artist_id: s.artist_id || undefined,
        } as Song);
        if (unique.length >= 8) break;
      }
      if (!cancelled) setItems(unique);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  if (!user || items.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-[20px] font-extrabold tracking-tight px-1">Jump back in</h2>
      <div className="grid grid-cols-2 gap-2">
        {items.map((song) => {
          const active = currentSong?.id === song.id;
          return (
            <motion.button
              key={song.id}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                triggerHaptic('selection');
                if (active) togglePlay();
                else playSong(song, getDownloadedUrl(song.id), items);
              }}
              className="relative flex items-center gap-2 rounded-lg overflow-hidden h-14 pr-2"
              style={{
                background: active
                  ? 'linear-gradient(90deg, hsl(var(--primary) / 0.25), rgba(255,255,255,0.06))'
                  : 'rgba(255,255,255,0.07)',
                border: '0.5px solid rgba(255,255,255,0.08)',
              }}
            >
              <div className="w-14 h-14 flex-shrink-0 bg-muted/40 overflow-hidden">
                {song.cover_url ? (
                  <img src={song.cover_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className={`flex-1 text-left text-[12.5px] font-bold leading-tight line-clamp-2 ${active ? 'text-primary' : 'text-foreground'}`}>
                {song.title}
              </p>
              {active && (
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center mr-1">
                  {isPlaying ? <Pause className="w-3 h-3 text-primary-foreground" fill="currentColor" /> : <Play className="w-3 h-3 text-primary-foreground ml-[1px]" fill="currentColor" />}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>
    </section>
  );
});

export default QuickPicksGrid;
