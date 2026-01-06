export const APP_EVENT_WALLETS_CHANGED = 'mq:wallets-changed';
export const APP_EVENT_TRANSFERS_CHANGED = 'mq:transfers-changed';

type AnyFn = (...args: any[]) => void;

const safeWindow = () => (typeof window !== 'undefined' ? window : null);

export function emitWalletsChanged() {
  safeWindow()?.dispatchEvent(new CustomEvent(APP_EVENT_WALLETS_CHANGED));
}

export function emitTransfersChanged() {
  safeWindow()?.dispatchEvent(new CustomEvent(APP_EVENT_TRANSFERS_CHANGED));
}

export function onWalletsChanged(handler: AnyFn) {
  const w = safeWindow();
  if (!w) return () => {};
  const listener = () => handler();
  w.addEventListener(APP_EVENT_WALLETS_CHANGED, listener);
  return () => w.removeEventListener(APP_EVENT_WALLETS_CHANGED, listener);
}

export function onTransfersChanged(handler: AnyFn) {
  const w = safeWindow();
  if (!w) return () => {};
  const listener = () => handler();
  w.addEventListener(APP_EVENT_TRANSFERS_CHANGED, listener);
  return () => w.removeEventListener(APP_EVENT_TRANSFERS_CHANGED, listener);
}
