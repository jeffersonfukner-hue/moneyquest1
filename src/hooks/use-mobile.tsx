import * as React from "react";

const MOBILE_BREAKPOINT = 768;

// Detect if device is touch-capable (iOS, Android, etc.)
function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    navigator.msMaxTouchPoints > 0
  );
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkMobile = () => {
      const isSmallScreen = window.innerWidth < MOBILE_BREAKPOINT;
      const isTouch = isTouchDevice();
      // Consider mobile if: small screen OR touch device (for iOS/Android in any viewport)
      setIsMobile(isSmallScreen || isTouch);
    };

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", checkMobile);
    checkMobile();
    
    return () => mql.removeEventListener("change", checkMobile);
  }, []);

  return !!isMobile;
}
