import { motion } from 'framer-motion';
import { Home, Search, Library, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { usePlayer } from '@/contexts/PlayerContext';

const navItems = [
  { icon: Home, label: 'Home', path: '/home' },
  { icon: Search, label: 'Search', path: '/search' },
  { icon: Library, label: 'Library', path: '/library' },
  { icon: User, label: 'Profile', path: '/profile' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentSong } = usePlayer();

  return (
    <motion.nav
      className={`fixed left-0 right-0 z-40 glass border-t border-white/5 ${
        currentSong ? 'bottom-[72px]' : 'bottom-0'
      }`}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <motion.button
              key={item.path}
              className="relative flex flex-col items-center gap-1 py-2 px-6"
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.9 }}
            >
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Icon
                  className={`w-6 h-6 transition-colors ${
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  }`}
                />
              </motion.div>
              <span
                className={`text-xs font-medium transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground'
                }`}
              >
                {item.label}
              </span>
              
              {isActive && (
                <motion.div
                  className="absolute -bottom-2 w-1 h-1 rounded-full bg-primary"
                  layoutId="nav-indicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.nav>
  );
};

export default BottomNav;
