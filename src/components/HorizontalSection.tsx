import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { ReactNode } from 'react';

interface HorizontalSectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onSeeAll?: () => void;
}

const HorizontalSection = ({ title, subtitle, children, onSeeAll }: HorizontalSectionProps) => {
  return (
    <motion.section
      className="mb-8"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-bold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        {onSeeAll && (
          <motion.button
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            onClick={onSeeAll}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.95 }}
          >
            See all
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        )}
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar snap-x snap-mandatory">
        {children}
      </div>
    </motion.section>
  );
};

export default HorizontalSection;
