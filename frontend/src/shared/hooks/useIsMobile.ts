import { useEffect, useState } from 'react';

/**
 * Hook to detect if the current device is mobile
 * @param breakpoint The width in pixels below which a device is considered mobile
 * @returns boolean indicating if the device is mobile
 */
export const useIsMobile = (breakpoint: number = 768): boolean => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Call once initially
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isMobile;
}; 