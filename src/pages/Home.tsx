import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Song } from '@/contexts/PlayerContext';
import SongCard from '@/components/SongCard';
import HorizontalSection from '@/components/HorizontalSection';
import BottomNav from '@/components/BottomNav';
import MiniPlayer from '@/components/MiniPlayer';
import FullscreenPlayer from '@/components/FullscreenPlayer';
import { Sparkles } from 'lucide-react';

// Demo songs for showcase
const demoSongs: Song[] = [
  { id: '1', title: 'Midnight Dreams', artist: 'Luna Wave', album: 'Nocturne', cover_url: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: '2', title: 'Electric Pulse', artist: 'Neon Lights', album: 'Voltage', cover_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: '3', title: 'Ocean Breeze', artist: 'Coastal', album: 'Tides', cover_url: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { id: '4', title: 'City Lights', artist: 'Metro', album: 'Urban', cover_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: '5', title: 'Summer Vibes', artist: 'Sunny Days', album: 'Heat', cover_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop', audio_url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
];

const Home = () => {
  const { user } = useAuth();
  const [songs, setSongs] = useState<Song[]>(demoSongs);

  useEffect(() => {
    // Fetch songs from database
    const fetchSongs = async () => {
      const { data } = await supabase.from('songs').select('*').eq('is_visible', true).order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setSongs(data.map(s => ({ id: s.id, title: s.title, artist: s.artist, album: s.album || undefined, cover_url: s.cover_url || undefined, audio_url: s.audio_url, duration: s.duration || undefined })));
      }
    };
    fetchSongs();

    // Realtime subscription
    const channel = supabase.channel('songs-changes').on('postgres_changes', { event: '*', schema: 'public', table: 'songs' }, () => { fetchSongs(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen bg-background pb-40">
      {/* Header */}
      <motion.header className="sticky top-0 z-30 glass px-6 py-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{greeting()}</p>
            <h1 className="text-xl font-display font-bold">{user?.email?.split('@')[0] || 'Music Lover'}</h1>
          </div>
          <motion.div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </motion.div>
        </div>
      </motion.header>

      <main className="px-6 pt-6">
        <HorizontalSection title="Trending Now" subtitle="What's hot right now">
          {songs.map((song, i) => <SongCard key={song.id} song={song} index={i} />)}
        </HorizontalSection>

        <HorizontalSection title="Recommended for You" subtitle="Based on your taste">
          {[...songs].reverse().map((song, i) => <SongCard key={song.id} song={song} index={i} />)}
        </HorizontalSection>

        <HorizontalSection title="New Releases" subtitle="Fresh tracks">
          {songs.slice(0, 4).map((song, i) => <SongCard key={song.id} song={song} index={i} />)}
        </HorizontalSection>
      </main>

      <BottomNav />
      <MiniPlayer />
      <FullscreenPlayer />
    </div>
  );
};

export default Home;
