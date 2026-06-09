import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import splashVideo from '@/assets/splash.mp4.asset.json';

interface SplashScreenProps {
  onComplete: () => void;
}

// Splash: plays the user-provided splash video full-bleed on a black backdrop.
// No ring, no halo, no title — just the video, like the user asked.
const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Hard cap so we never block the app even if the video stalls
    const fallback = setTimeout(onComplete, 4000);
    return () => clearTimeout(fallback);
  }, [onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <video
        ref={videoRef}
        src={splashVideo.url}
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={onComplete}
        onError={onComplete}
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
};

export default SplashScreen;
