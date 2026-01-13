import { motion } from 'framer-motion';
import { Music } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  return (
    <motion.div
      className="fixed inset-0 bg-background flex items-center justify-center z-50"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      onAnimationComplete={() => {
        setTimeout(onComplete, 2000);
      }}
    >
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/20 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/20 blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5
          }}
        />
      </div>

      <div className="relative flex flex-col items-center">
        {/* Logo container with glow */}
        <motion.div
          className="relative"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 200,
            damping: 20,
            delay: 0.2
          }}
        >
          <motion.div
            className="w-32 h-32 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center"
            animate={{
              boxShadow: [
                "0 0 20px hsl(var(--primary) / 0.3)",
                "0 0 60px hsl(var(--primary) / 0.5)",
                "0 0 20px hsl(var(--primary) / 0.3)",
              ]
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Music className="w-16 h-16 text-primary-foreground" />
          </motion.div>
        </motion.div>

        {/* Waveform animation */}
        <motion.div
          className="flex items-end gap-1 mt-8 h-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          {[...Array(7)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 bg-gradient-to-t from-primary to-accent rounded-full"
              animate={{
                height: [8, 32 + Math.random() * 16, 8],
              }}
              transition={{
                duration: 0.8 + Math.random() * 0.4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
          ))}
        </motion.div>

        {/* Brand name */}
        <motion.h1
          className="mt-8 text-4xl font-display font-bold gradient-text"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          Sonique
        </motion.h1>

        <motion.p
          className="mt-2 text-muted-foreground text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          Premium Music Experience
        </motion.p>
      </div>
    </motion.div>
  );
};

export default SplashScreen;
