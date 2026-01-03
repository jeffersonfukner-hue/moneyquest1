// WhatsApp helper (Lovable-safe): always opens wa.me as a real external link

interface WhatsAppChatOptions {
  phoneE164: string;
  text?: string;
}

interface WhatsAppShareOptions {
  text: string;
}

interface OpenWhatsAppOptions {
  mode: 'chat' | 'share';
  phoneE164?: string;
  text?: string;
}

export const buildWaMeChatUrl = ({ phoneE164, text }: WhatsAppChatOptions): string => {
  const messageParam = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${phoneE164}${messageParam}`;
};

export const buildWaMeShareUrl = ({ text }: WhatsAppShareOptions): string => {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
};

/**
 * Forces opening a real external link in a new tab.
 * (Using a programmatic <a> click avoids SPA navigation interception.)
 */
export const openExternalUrl = (url: string): void => {
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
};

/**
 * Open WhatsApp via wa.me (external, _blank).
 */
export const openWhatsApp = ({ mode, phoneE164, text }: OpenWhatsAppOptions): void => {
  const url = mode === 'chat' && phoneE164
    ? buildWaMeChatUrl({ phoneE164, text })
    : buildWaMeShareUrl({ text: text || '' });

  openExternalUrl(url);
};
