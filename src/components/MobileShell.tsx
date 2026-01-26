import { ReactNode } from 'react';

interface MobileShellProps {
  children: ReactNode;
}

/**
 * MobileShell - Full-screen mobile app container
 * No responsive desktop scaling - pure mobile rendering
 */
const MobileShell = ({ children }: MobileShellProps) => {
  return (
    <div 
      className="fixed inset-0 w-full h-full bg-background overflow-y-auto overflow-x-hidden"
      style={{
        touchAction: 'manipulation',
        minHeight: '100dvh',
        maxHeight: '100dvh',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {children}
    </div>
  );
};

export default MobileShell;
