import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward, Volume2, Shuffle, Repeat, Repeat1, ChevronDown, Heart, ListMusic } from 'lucide-react';
import { usePlayer } from '@/contexts/PlayerContext';
import { Slider } from '@/components/ui/slider';

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const FullscreenPlayer = () => {
  const {
    currentSong,
    isPlaying,
    progress,
    duration,
    volume,
    shuffle,
    repeat,
    isExpanded,
    togglePlay,
    nextSong,
    prevSong,
    seek,
    setVolume,
    toggleShuffle,
    toggleRepeat,
    setExpanded
  } = usePlayer();

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.y > 100) {
      setExpanded(false);
    }
  };

  if (!currentSong || !isExpanded) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-background overflow-hidden"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.5 }}
        onDragEnd={handleDragEnd}
      >
        {/* Background gradient based on album art */}
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-gradient-to-b from-primary/20 via-background to-background"
          />
          {currentSong.cover_url && (
            <motion.img
              src={currentSong.cover_url}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-3xl scale-150"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
            />
          )}
        </div>

        <div className="relative flex flex-col h-full px-6 py-8 md:px-12 lg:px-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <motion.button
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              onClick={() => setExpanded(false)}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronDown className="w-6 h-6" />
            </motion.button>
            <p className="text-sm font-medium text-muted-foreground">Now Playing</p>
            <motion.button
              className="p-2 rounded-full hover:bg-white/10 transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <ListMusic className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Album Art */}
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              className="relative w-72 h-72 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-2xl overflow-hidden shadow-2xl"
              layoutId="album-art"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              {currentSong.cover_url ? (
                <motion.img
                  src={currentSong.cover_url}
                  alt={currentSong.title}
                  className="w-full h-full object-cover"
                  animate={isPlaying ? { rotate: 360 } : {}}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/50 to-accent/50 flex items-center justify-center">
                  <div className="flex items-end gap-1 h-24">
                    {[...Array(5)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-3 bg-white/80 rounded-full"
                        animate={isPlaying ? {
                          height: [20, 80 + Math.random() * 20, 20],
                        } : { height: 20 }}
                        transition={{
                          duration: 0.6 + Math.random() * 0.3,
                          repeat: Infinity,
                          ease: "easeInOut",
                          delay: i * 0.1,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-2xl glow-primary opacity-50" />
            </motion.div>
          </div>

          {/* Song Info */}
          <div className="mt-8 text-center">
            <motion.h2
              className="text-2xl md:text-3xl font-display font-bold truncate"
              layoutId="song-title"
            >
              {currentSong.title}
            </motion.h2>
            <motion.p
              className="mt-2 text-lg text-muted-foreground"
              layoutId="song-artist"
            >
              {currentSong.artist}
            </motion.p>
          </div>

          {/* Progress */}
          <div className="mt-8">
            <Slider
              value={[progress]}
              max={duration || 100}
              step={1}
              onValueChange={([value]) => seek(value)}
              className="cursor-pointer"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8 mt-8">
            <motion.button
              className={`p-2 rounded-full transition-colors ${shuffle ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={toggleShuffle}
              whileTap={{ scale: 0.9 }}
            >
              <Shuffle className="w-5 h-5" />
            </motion.button>
            
            <motion.button
              className="p-3 rounded-full hover:bg-white/10 transition-colors"
              onClick={prevSong}
              whileTap={{ scale: 0.9 }}
            >
              <SkipBack className="w-7 h-7" />
            </motion.button>
            
            <motion.button
              className="w-16 h-16 rounded-full bg-white flex items-center justify-center text-background"
              onClick={togglePlay}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
            >
              {isPlaying ? (
                <Pause className="w-8 h-8" />
              ) : (
                <Play className="w-8 h-8 ml-1" />
              )}
            </motion.button>
            
            <motion.button
              className="p-3 rounded-full hover:bg-white/10 transition-colors"
              onClick={nextSong}
              whileTap={{ scale: 0.9 }}
            >
              <SkipForward className="w-7 h-7" />
            </motion.button>
            
            <motion.button
              className={`p-2 rounded-full transition-colors ${repeat !== 'off' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              onClick={toggleRepeat}
              whileTap={{ scale: 0.9 }}
            >
              {repeat === 'one' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </motion.button>
          </div>

          {/* Volume & Actions */}
          <div className="flex items-center justify-between mt-8 px-4">
            <motion.button
              className="p-2 rounded-full hover:bg-white/10 transition-colors text-muted-foreground hover:text-primary"
              whileTap={{ scale: 0.9 }}
            >
              <Heart className="w-5 h-5" />
            </motion.button>
            
            <div className="flex items-center gap-3 w-32">
              <Volume2 className="w-4 h-4 text-muted-foreground" />
              <Slider
                value={[volume * 100]}
                max={100}
                step={1}
                onValueChange={([value]) => setVolume(value / 100)}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FullscreenPlayer;
