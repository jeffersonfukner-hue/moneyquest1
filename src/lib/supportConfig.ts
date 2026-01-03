// Configuração centralizada de suporte

export const SUPPORT_CONFIG = {
  whatsapp: {
    number: '5543998650196',
    getUrl: (message?: string) => 
      `https://wa.me/5543998650196${message ? `?text=${encodeURIComponent(message)}` : ''}`,
  },
  email: 'suporte@moneyquest.app',
  hours: {
    weekdays: '09:00 - 18:00',
    weekends: 'Fechado',
    timezone: 'America/Sao_Paulo',
  },
  links: {
    faq: '/support',
    terms: '/terms',
    privacy: '/privacy',
    features: '/features',
  },
  social: {
    instagram: 'https://instagram.com/moneyquestapp',
  },
} as const;

// Exports diretos para compatibilidade
export const WHATSAPP_SUPPORT_NUMBER = SUPPORT_CONFIG.whatsapp.number;
export const SUPPORT_EMAIL = SUPPORT_CONFIG.email;
