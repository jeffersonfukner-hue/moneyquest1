import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isRestrictedRoute } from '@/lib/routeConfig';

interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  noIndex?: boolean; // Can be used to override for specific pages
}

const BASE_URL = 'https://www.moneyquest.app.br';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'MoneyQuest';
const TWITTER_HANDLE = '@moneyquestapp';

// Page-specific SEO configurations
const pageConfigs: Record<string, SEOConfig> = {
  // === PUBLIC PAGES (index, follow) ===
  '/': {
    title: 'MoneyQuest – Controle Financeiro Inteligente',
    description: 'MoneyQuest é um app de controle financeiro pessoal com gamificação, metas e modo premium sem anúncios.',
  },
  '/login': {
    title: 'Entrar | MoneyQuest',
    description: 'Faça login na sua conta MoneyQuest e continue sua jornada financeira. Acompanhe seus gastos, metas e conquistas.',
  },
  '/signup': {
    title: 'Criar Conta | MoneyQuest',
    description: 'Comece sua aventura financeira! Crie sua conta gratuita no MoneyQuest e transforme o controle de gastos em um jogo divertido.',
  },
  '/features': {
    title: 'Recursos | MoneyQuest',
    description: 'Conheça todos os recursos do MoneyQuest: gamificação, metas financeiras, coach IA e modo premium sem anúncios.',
  },
  '/premium': {
    title: 'MoneyQuest Premium - Recursos Exclusivos',
    description: 'Desbloqueie todo o potencial do MoneyQuest! Relatórios avançados, IA Coach, temas exclusivos e muito mais.',
  },
  '/terms': {
    title: 'Termos de Uso | MoneyQuest',
    description: 'Leia os Termos de Uso do MoneyQuest. Entenda seus direitos e responsabilidades ao usar nosso aplicativo de controle financeiro.',
  },
  '/privacy': {
    title: 'Política de Privacidade | MoneyQuest',
    description: 'Saiba como o MoneyQuest protege seus dados. Nossa Política de Privacidade em conformidade com a LGPD.',
  },

  // === AUTHENTICATED PAGES (noindex, nofollow) ===
  '/onboarding': {
    title: 'Configuração Inicial | MoneyQuest',
    description: 'Configure sua conta MoneyQuest e personalize sua experiência financeira.',
    noIndex: true,
  },
  '/ai-coach': {
    title: 'Coach Financeiro IA | MoneyQuest',
    description: 'Receba conselhos personalizados de um coach financeiro inteligente.',
    noIndex: true,
  },
  '/category-goals': {
    title: 'Metas por Categoria | MoneyQuest',
    description: 'Defina e acompanhe metas de orçamento para cada categoria de gastos.',
    noIndex: true,
  },
  '/categories': {
    title: 'Categorias | MoneyQuest',
    description: 'Gerencie suas categorias de receitas e despesas.',
    noIndex: true,
  },
  '/leaderboard': {
    title: 'Ranking | MoneyQuest',
    description: 'Veja sua posição no ranking global!',
    noIndex: true,
  },
  '/journal': {
    title: 'Diário de Aventuras | MoneyQuest',
    description: 'Acompanhe sua jornada financeira com narrativas personalizadas.',
    noIndex: true,
  },
  '/wallets': {
    title: 'Carteiras | MoneyQuest',
    description: 'Gerencie todas as suas contas e carteiras em um só lugar.',
    noIndex: true,
  },
  '/cash-flow': {
    title: 'Fluxo de Caixa | MoneyQuest',
    description: 'Visualize seu fluxo de caixa com gráficos detalhados.',
    noIndex: true,
  },
  '/period-comparison': {
    title: 'Comparação de Períodos | MoneyQuest',
    description: 'Compare seus gastos entre diferentes períodos.',
    noIndex: true,
  },
  '/referral': {
    title: 'Indicações | MoneyQuest',
    description: 'Convide amigos e ganhe recompensas.',
    noIndex: true,
  },
  '/notifications': {
    title: 'Notificações | MoneyQuest',
    description: 'Acompanhe suas notificações e alertas.',
    noIndex: true,
  },
  '/support': {
    title: 'Suporte | MoneyQuest',
    description: 'Central de ajuda e suporte ao usuário.',
    noIndex: true,
  },
  '/upgrade': {
    title: 'Upgrade Premium | MoneyQuest',
    description: 'Faça upgrade para o plano premium.',
    noIndex: true,
  },
  '/premium-success': {
    title: 'Assinatura Confirmada | MoneyQuest',
    description: 'Sua assinatura premium foi ativada com sucesso.',
    noIndex: true,
  },
  '/settings': {
    title: 'Configurações | MoneyQuest',
    description: 'Personalize sua experiência no MoneyQuest.',
    noIndex: true,
  },
  '/profile': {
    title: 'Perfil | MoneyQuest',
    description: 'Visualize e edite seu perfil MoneyQuest.',
    noIndex: true,
  },
  '/my-messages': {
    title: 'Mensagens | MoneyQuest',
    description: 'Suas mensagens e comunicações.',
    noIndex: true,
  },
};

export function useSEO(customConfig?: SEOConfig) {
  const location = useLocation();
  const { i18n } = useTranslation();

  useEffect(() => {
    const pathname = location.pathname;
    const config = { ...pageConfigs[pathname], ...customConfig };

    // Default fallback
    const title = config.title || `${SITE_NAME} - Gamifique suas Finanças`;
    const description = config.description || 'Transforme o controle financeiro em uma aventura épica! Ganhe XP, complete missões e conquiste suas metas.';
    const image = config.image || DEFAULT_IMAGE;
    const type = config.type || 'website';
    const url = `${BASE_URL}${pathname}`;
    const locale = i18n.language === 'pt-BR' ? 'pt_BR' : i18n.language === 'es-ES' ? 'es_ES' : 'en_US';

    // Update document title
    document.title = title;

    // Helper to update or create meta tag
    const setMeta = (property: string, content: string, isName = false) => {
      const attr = isName ? 'name' : 'property';
      let element = document.querySelector(`meta[${attr}="${property}"]`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, property);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
    };

    // Basic meta tags
    setMeta('description', description, true);
    setMeta('author', 'MoneyQuest', true);

    // Robots - use centralized route config, with override support
    const shouldNoIndex = config.noIndex !== undefined 
      ? config.noIndex 
      : isRestrictedRoute(pathname);
    
    if (shouldNoIndex) {
      setMeta('robots', 'noindex, nofollow', true);
    } else {
      setMeta('robots', 'index, follow', true);
    }

    // Open Graph tags
    setMeta('og:title', title);
    setMeta('og:description', description);
    setMeta('og:type', type);
    setMeta('og:url', url);
    setMeta('og:image', image);
    setMeta('og:image:width', '1200');
    setMeta('og:image:height', '630');
    setMeta('og:site_name', SITE_NAME);
    setMeta('og:locale', locale);

    // Twitter Card tags
    setMeta('twitter:card', 'summary_large_image', true);
    setMeta('twitter:site', TWITTER_HANDLE, true);
    setMeta('twitter:creator', TWITTER_HANDLE, true);
    setMeta('twitter:title', title, true);
    setMeta('twitter:description', description, true);
    setMeta('twitter:image', image, true);
    setMeta('twitter:image:alt', `${SITE_NAME} - ${title}`, true);

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

  }, [location.pathname, customConfig, i18n.language]);
}

export default useSEO;
