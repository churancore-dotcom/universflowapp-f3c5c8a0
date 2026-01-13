import { motion } from 'framer-motion';
import { Play, Pause } from 'lucide-react';
import { usePlayer, Song } from '@/contexts/PlayerContext';

interface SongCardProps {
  song: Song;
  index?: number;
}

const SongCard = ({ song, index = 0 }: SongCardProps) => {
  const { currentSong, isPlaying, playSong, togglePlay } = usePlayer();
  const isCurrentSong = currentSong?.id === song.id;

  const handleClick = () => {
    if (isCurrentSong) {
      togglePlay();
    } else {
      playSong(song);
    }
  };

  return (
    <motion.div
      className="group relative flex-shrink-0 w-40 md:w-48"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <motion.div
        className="relative aspect-square rounded-xl overflow-hidden bg-muted cursor-pointer"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
      >
        {song.cover_url ? (
          <img
            src={song.cover_url}
            alt={song.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30 flex items-center justify-center">
            <div className="flex items-end gap-0.5 h-8">
              {[...Array(4)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-white/60 rounded-full"
                  animate={isCurrentSong && isPlaying ? {
                    height: [4, 24, 4],
                  } : { height: 8 }}
                  transition={{
                    duration: 0.5,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Play button overlay */}
        <motion.div
          className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          initial={false}
        >
          <motion.div
            className="w-12 h-12 rounded-full bg-primary flex items-center justify-center glow-sm"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {isCurrentSong && isPlaying ? (
              <Pause className="w-5 h-5 text-primary-foreground" />
            ) : (
              <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
            )}
          </motion.div>
        </motion.div>

        {/* Playing indicator */}
        {isCurrentSong && (
          <motion.div
            className="absolute bottom-2 right-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <div className="flex items-end gap-0.5 h-3">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-0.5 bg-primary-foreground rounded-full"
                    animate={isPlaying ? {
                      height: [2, 10, 2],
                    } : { height: 4 }}
                    transition={{
                      duration: 0.4,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
      
      <div className="mt-3">
        <p className={`font-medium text-sm truncate ${isCurrentSong ? 'text-primary' : ''}`}>
          {song.title}
        </p>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {song.artist}
        </p>
      </div>
    </motion.div>
  );
};

export default SongCard;
