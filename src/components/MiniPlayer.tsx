import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, ChevronUp } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';

const MiniPlayer = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    togglePlay,
    nextSong,
    prevSong,
    setExpanded
  } = usePlayer();

  if (!currentSong) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <AnimatePresence>
      <motion.div
        className="player-bar"
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            style={{ width: `${progressPercent}%` }}
            layoutId="progress-bar"
          />
        </div>

        <div className="flex items-center justify-between px-4 py-3 md:px-6">
          {/* Song info */}
          <motion.div
            className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
            onClick={() => setExpanded(true)}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div
              className="relative w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0"
              layoutId="album-art"
            >
              {currentSong.cover_url ? (
                <img
                  src={currentSong.cover_url}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/30 to-accent/30" />
              )}
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 bg-black/20 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div className="flex items-end gap-0.5 h-4">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-0.5 bg-white rounded-full"
                        animate={{
                          height: [4, 16, 4],
                        }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          delay: i * 0.15,
                        }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
            
            <div className="min-w-0">
              <motion.p
                className="font-medium text-sm truncate"
                layoutId="song-title"
              >
                {currentSong.title}
              </motion.p>
              <motion.p
                className="text-xs text-muted-foreground truncate"
                layoutId="song-artist"
              >
                {currentSong.artist}
              </motion.p>
            </div>
          </motion.div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <motion.button
              className="p-2 rounded-full hover:bg-white/10 transition-colors hidden md:flex"
              onClick={prevSong}
              whileTap={{ scale: 0.9 }}
            >
              <SkipBack className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-background"
              onClick={togglePlay}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </motion.button>
            
            <motion.button
              className="p-2 rounded-full hover:bg-white/10 transition-colors hidden md:flex"
              onClick={nextSong}
              whileTap={{ scale: 0.9 }}
            >
              <SkipForward className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Expand button */}
          <motion.button
            className="p-2 rounded-full hover:bg-white/10 transition-colors ml-4"
            onClick={() => setExpanded(true)}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default MiniPlayer;
