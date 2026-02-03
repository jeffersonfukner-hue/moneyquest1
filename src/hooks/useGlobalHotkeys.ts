import { useEffect } from 'react';
import { useIsDesktop } from './use-mobile';

export function useGlobalHotkeys() {
  const isDesktop = useIsDesktop();

  useEffect(() => {
    // Hotkeys only on desktop
    if (!isDesktop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is in input/textarea/contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.closest('[role="dialog"]') || // Ignore in modals
        target.closest('[data-radix-popper-content-wrapper]') // Ignore in popovers
      ) {
        return;
      }

      // "/" or Cmd+K -> Global search
      if (e.key === '/' || (e.metaKey && e.key === 'k')) {
        e.preventDefault();
        document.dispatchEvent(new CustomEvent('open-global-search'));
      }

      // Ctrl+B -> Toggle sidebar (handled by sidebar.tsx)
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDesktop]);
}
