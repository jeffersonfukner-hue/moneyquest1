// WhatsApp helper with fallback strategy to avoid api.whatsapp.com blocking

const isMobile = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
};

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

/**
 * Build WhatsApp chat URLs (with phone number)
 */
export const buildWhatsAppChatUrls = ({ phoneE164, text }: WhatsAppChatOptions) => {
  const encodedText = text ? encodeURIComponent(text) : '';
  const textParam = text ? `&text=${encodedText}` : '';
  
  return {
    app: `whatsapp://send?phone=${phoneE164}${textParam}`,
    web: `https://web.whatsapp.com/send?phone=${phoneE164}${textParam}`,
  };
};

/**
 * Build WhatsApp share URLs (without phone number, for sharing content)
 */
export const buildWhatsAppShareUrls = ({ text }: WhatsAppShareOptions) => {
  const encodedText = encodeURIComponent(text);
  
  return {
    app: `whatsapp://send?text=${encodedText}`,
    web: `https://web.whatsapp.com/send?text=${encodedText}`,
  };
};

/**
 * Open WhatsApp with intelligent fallback
 * - Mobile: tries app deep link first, falls back to web
 * - Desktop: opens web.whatsapp.com directly
 */
export const openWhatsApp = ({ mode, phoneE164, text }: OpenWhatsAppOptions): void => {
  const urls = mode === 'chat' && phoneE164
    ? buildWhatsAppChatUrls({ phoneE164, text })
    : buildWhatsAppShareUrls({ text: text || '' });

  if (isMobile()) {
    // On mobile, try app deep link
    window.location.href = urls.app;
    
    // Fallback to web after short delay if app doesn't open
    setTimeout(() => {
      window.open(urls.web, '_blank');
    }, 1000);
  } else {
    // On desktop, open web.whatsapp.com directly
    window.open(urls.web, '_blank');
  }
};
