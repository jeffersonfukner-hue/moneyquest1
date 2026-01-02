export type BannerType = 'google' | 'internal_referral' | 'internal_premium';

interface BannerRotationConfig {
  distribution: {
    googleAds: number;
    internal: number;
  };
  internalDistribution: {
    referral: number;
    premium: number;
  };
  debug: {
    enabled: boolean;
    forceType: BannerType | null;
    logEnabled: boolean;
  };
}

export const BANNER_ROTATION_CONFIG: BannerRotationConfig = {
  // Distribuição principal: 70% Google Ads, 30% Banners internos
  distribution: {
    googleAds: 70,
    internal: 30,
  },
  
  // Distribuição interna (dentro dos 30%)
  internalDistribution: {
    referral: 50,  // 50% Banner de Indicação
    premium: 50,   // 50% Banner Premium
  },
  
  // Modo debug (para testes)
  debug: {
    enabled: false,
    forceType: null,
    logEnabled: import.meta.env.DEV,
  },
};

// Função de logging para debug
export const logBannerDebug = (
  action: string, 
  details: Record<string, unknown>
) => {
  if (!BANNER_ROTATION_CONFIG.debug.logEnabled) return;
  
  console.log(
    `%c[BannerRotation] ${action}`,
    'color: #9333ea; font-weight: bold;',
    {
      timestamp: new Date().toISOString(),
      ...details,
      distribution: BANNER_ROTATION_CONFIG.distribution,
    }
  );
};

// Função para modo debug (usar no console do navegador)
// window.setBannerDebug('internal_referral') // Força tipo específico
// window.setBannerDebug(null) // Volta ao normal
if (typeof window !== 'undefined') {
  (window as unknown as { setBannerDebug: (type: BannerType | null) => void }).setBannerDebug = (type: BannerType | null) => {
    BANNER_ROTATION_CONFIG.debug.enabled = type !== null;
    BANNER_ROTATION_CONFIG.debug.forceType = type;
    console.log('%c[BannerRotation] Debug mode:', 'color: #9333ea; font-weight: bold;', type ? `Forcing ${type}` : 'Disabled');
  };
}

// Seleciona tipo de banner baseado em probabilidade
export const selectBannerType = (): BannerType => {
  // Se debug forçado, usar tipo específico
  if (BANNER_ROTATION_CONFIG.debug.enabled && BANNER_ROTATION_CONFIG.debug.forceType) {
    logBannerDebug('Forced type', { type: BANNER_ROTATION_CONFIG.debug.forceType });
    return BANNER_ROTATION_CONFIG.debug.forceType;
  }
  
  // Gerar número aleatório (0-100)
  const random = Math.random() * 100;
  
  // 70% Google, 30% Interno
  if (random < BANNER_ROTATION_CONFIG.distribution.googleAds) {
    logBannerDebug('Selected', { type: 'google', random: random.toFixed(2) });
    return 'google';
  }
  
  // Dentro dos 30%, escolher entre Referral e Premium
  const internalRandom = Math.random() * 100;
  const internalType = internalRandom < BANNER_ROTATION_CONFIG.internalDistribution.referral 
    ? 'internal_referral' 
    : 'internal_premium';
  
  logBannerDebug('Selected', { type: internalType, random: random.toFixed(2), internalRandom: internalRandom.toFixed(2) });
  return internalType;
};

// Seleciona banner interno aleatório (para fallback)
export const selectRandomInternalBanner = (): BannerType => {
  const random = Math.random() * 100;
  const type = random < BANNER_ROTATION_CONFIG.internalDistribution.referral 
    ? 'internal_referral' 
    : 'internal_premium';
  
  logBannerDebug('Fallback to internal', { type, random: random.toFixed(2) });
  return type;
};
