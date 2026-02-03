import * as React from "react";

const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

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

export function useBreakpoint(): Breakpoint {
  // Synchronous initial value to avoid flicker
  const getInitialBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') return 'mobile';
    if (window.innerWidth >= BREAKPOINTS.TABLET) return 'desktop';
    if (window.innerWidth >= BREAKPOINTS.MOBILE) return 'tablet';
    return 'mobile';
  };

  const [breakpoint, setBreakpoint] = React.useState<Breakpoint>(getInitialBreakpoint);

  React.useEffect(() => {
    const check = () => {
      if (window.innerWidth >= BREAKPOINTS.TABLET) {
        setBreakpoint('desktop');
      } else if (window.innerWidth >= BREAKPOINTS.MOBILE) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('mobile');
      }
    };

    // Single resize listener with guaranteed cleanup
    window.addEventListener('resize', check);
    
    // Initial check after mount (in case of SSR mismatch)
    check();

    return () => {
      window.removeEventListener('resize', check);
    };
  }, []);

  return breakpoint;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkMobile = () => {
      const isSmallScreen = window.innerWidth < BREAKPOINTS.MOBILE;
      const isTouch = isTouchDevice();
      // Consider mobile if: small screen OR touch device (for iOS/Android in any viewport)
      setIsMobile(isSmallScreen || isTouch);
    };

    const mql = window.matchMedia(`(max-width: ${BREAKPOINTS.MOBILE - 1}px)`);
    mql.addEventListener("change", checkMobile);
    checkMobile();
    
    return () => mql.removeEventListener("change", checkMobile);
  }, []);

  return !!isMobile;
}

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = React.useState<boolean>(false);

  React.useEffect(() => {
    const check = () => {
      setIsDesktop(window.innerWidth >= BREAKPOINTS.TABLET);
    };

    check();

    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.TABLET}px)`);
    mql.addEventListener("change", check);

    return () => mql.removeEventListener("change", check);
  }, []);

  return isDesktop;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(false);

  React.useEffect(() => {
    const check = () => {
      const width = window.innerWidth;
      setIsTablet(width >= BREAKPOINTS.MOBILE && width < BREAKPOINTS.TABLET);
    };

    check();

    const mql = window.matchMedia(`(min-width: ${BREAKPOINTS.MOBILE}px) and (max-width: ${BREAKPOINTS.TABLET - 1}px)`);
    mql.addEventListener("change", check);

    return () => mql.removeEventListener("change", check);
  }, []);

  return isTablet;
}
