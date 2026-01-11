import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isRestrictedRoute, NOINDEX_PUBLIC_ROUTES } from '@/lib/routeConfig';

interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  noIndex?: boolean; // Can be used to override for specific pages
}

const BASE_URL = 'https://moneyquest.app.br';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'MoneyQuest';
const TWITTER_HANDLE = '@moneyquestapp';

/**
 * Check if route should have noindex meta tag
 * Includes: all authenticated routes + specific public routes (/login, /signup, /premium)
 */
const shouldNoIndex = (pathname: string, configNoIndex?: boolean): boolean => {
  // Explicit override from config takes precedence
  if (configNoIndex !== undefined) {
    return configNoIndex;
  }
  
  // Check if it's a noindex public route (login, signup, premium, etc.)
  const isNoIndexPublic = NOINDEX_PUBLIC_ROUTES.some(
    route => pathname === route || pathname.startsWith(`${route}/`)
  );
  
  if (isNoIndexPublic) {
    return true;
  }
  
  // Check if it's a restricted (authenticated) route
  return isRestrictedRoute(pathname);
};

// Page-specific SEO configurations
// All pages get their canonical URL set to their own absolute URL
const pageConfigs: Record<string, SEOConfig> = {
  // === PUBLIC INDEXABLE PAGES (index, follow) ===
  '/': {
    title: 'MoneyQuest – App Financeiro Gamificado',
    description: 'MoneyQuest é um app financeiro gamificado para controlar gastos, criar hábitos financeiros, ganhar pontos, subir de nível e economizar dinheiro jogando.',
  },
  '/controle-financeiro': {
    title: 'Controle Financeiro Pessoal: o Guia Completo para Organizar Seu Dinheiro | MoneyQuest',
    description: 'Aprenda como fazer controle financeiro pessoal de forma prática e sustentável. Guia completo com métodos que funcionam para organizar gastos mensais e transformar sua vida financeira.',
  },
  '/educacao-financeira-gamificada': {
    title: 'Educação Financeira Gamificada | MoneyQuest',
    description: 'Aprenda educação financeira jogando com missões, desafios e recompensas. Desenvolva hábitos financeiros saudáveis de forma divertida.',
  },
  '/desafios-financeiros': {
    title: 'Desafios Financeiros | MoneyQuest',
    description: 'Complete desafios financeiros, ganhe recompensas e melhore seus hábitos financeiros. Missões diárias, semanais e mensais.',
  },
  '/app-financas-pessoais': {
    title: 'App de Finanças Pessoais | MoneyQuest',
    description: 'MoneyQuest é o melhor app de finanças pessoais com gamificação. Controle gastos, defina metas e economize dinheiro de forma divertida.',
  },
  '/features': {
    title: 'Recursos | MoneyQuest',
    description: 'Conheça todos os recursos do MoneyQuest: gamificação, metas financeiras, coach IA e modo premium sem anúncios.',
  },
  '/about': {
    title: 'Sobre Nós | MoneyQuest',
    description: 'Conheça a equipe por trás do MoneyQuest, nossa missão de democratizar a educação financeira e tornar o controle de gastos divertido.',
  },
  '/terms': {
    title: 'Termos de Uso | MoneyQuest',
    description: 'Leia os Termos de Uso do MoneyQuest. Entenda seus direitos e responsabilidades ao usar nosso aplicativo de controle financeiro.',
  },
  '/privacy': {
    title: 'Política de Privacidade | MoneyQuest',
    description: 'Saiba como o MoneyQuest protege seus dados. Nossa Política de Privacidade em conformidade com a LGPD.',
  },

  // === PUBLIC NOINDEX PAGES (noindex, follow) ===
  // These are accessible but should not appear in search results
  '/login': {
    title: 'Entrar | MoneyQuest',
    description: 'Faça login na sua conta MoneyQuest.',
    noIndex: true,
  },
  '/signup': {
    title: 'Criar Conta | MoneyQuest',
    description: 'Crie sua conta gratuita no MoneyQuest.',
    noIndex: true,
  },
  '/premium': {
    title: 'MoneyQuest Premium - Recursos Exclusivos',
    description: 'Desbloqueie todo o potencial do MoneyQuest com o plano Premium.',
    noIndex: true,
  },
  '/select-language': {
    title: 'Selecionar Idioma | MoneyQuest',
    description: 'Escolha seu idioma preferido para usar o MoneyQuest.',
    noIndex: true,
  },

  // === AUTHENTICATED PAGES (noindex, follow) ===
  '/dashboard': {
    title: 'Dashboard | MoneyQuest',
    description: 'Seu painel financeiro gamificado.',
    noIndex: true,
  },
  '/onboarding': {
    title: 'Configuração Inicial | MoneyQuest',
    description: 'Configure sua conta MoneyQuest.',
    noIndex: true,
  },
  '/ai-coach': {
    title: 'Coach Financeiro IA | MoneyQuest',
    description: 'Receba conselhos financeiros personalizados.',
    noIndex: true,
  },
  '/category-goals': {
    title: 'Metas por Categoria | MoneyQuest',
    description: 'Defina metas de orçamento por categoria.',
    noIndex: true,
  },
  '/categories': {
    title: 'Categorias | MoneyQuest',
    description: 'Gerencie suas categorias.',
    noIndex: true,
  },
  '/leaderboard': {
    title: 'Ranking | MoneyQuest',
    description: 'Veja sua posição no ranking.',
    noIndex: true,
  },
  '/journal': {
    title: 'Diário de Aventuras | MoneyQuest',
    description: 'Sua jornada financeira.',
    noIndex: true,
  },
  '/wallets': {
    title: 'Carteiras | MoneyQuest',
    description: 'Gerencie suas carteiras.',
    noIndex: true,
  },
  '/scheduled': {
    title: 'Agendamentos | MoneyQuest',
    description: 'Transações e transferências agendadas.',
    noIndex: true,
  },
  '/cash-flow': {
    title: 'Fluxo de Caixa | MoneyQuest',
    description: 'Visualize seu fluxo de caixa.',
    noIndex: true,
  },
  '/period-comparison': {
    title: 'Comparação de Períodos | MoneyQuest',
    description: 'Compare seus gastos entre períodos.',
    noIndex: true,
  },
  '/referral': {
    title: 'Indicações | MoneyQuest',
    description: 'Convide amigos e ganhe recompensas.',
    noIndex: true,
  },
  '/notifications': {
    title: 'Notificações | MoneyQuest',
    description: 'Suas notificações.',
    noIndex: true,
  },
  '/support': {
    title: 'Suporte | MoneyQuest',
    description: 'Central de ajuda.',
    noIndex: true,
  },
  '/upgrade': {
    title: 'Upgrade Premium | MoneyQuest',
    description: 'Faça upgrade para o Premium.',
    noIndex: true,
  },
  '/premium-success': {
    title: 'Assinatura Confirmada | MoneyQuest',
    description: 'Sua assinatura foi ativada.',
    noIndex: true,
  },
  '/settings': {
    title: 'Configurações | MoneyQuest',
    description: 'Personalize sua experiência.',
    noIndex: true,
  },
  '/profile': {
    title: 'Perfil | MoneyQuest',
    description: 'Seu perfil MoneyQuest.',
    noIndex: true,
  },
  '/my-messages': {
    title: 'Mensagens | MoneyQuest',
    description: 'Suas mensagens.',
    noIndex: true,
  },
  '/shop': {
    title: 'Loja | MoneyQuest',
    description: 'Loja de itens e recompensas.',
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
    const title = config.title || `${SITE_NAME} – App Financeiro Gamificado`;
    const description = config.description || 'MoneyQuest é um app financeiro gamificado para controlar gastos e economizar dinheiro jogando.';
    const image = config.image || DEFAULT_IMAGE;
    const type = config.type || 'website';
    
    // CRITICAL: Canonical URL MUST point to the page's own absolute URL
    // NEVER use "/" as canonical for internal pages
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

    // Robots - use centralized logic
    // noindex pages: /login, /signup, /premium, /dashboard, and all authenticated routes
    // index pages: /, /about, /features, /blog, /blog/*, etc.
    const isNoIndex = shouldNoIndex(pathname, config.noIndex);
    
    if (isNoIndex) {
      // noindex but follow - allows link equity to flow
      setMeta('robots', 'noindex, follow', true);
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

    // Canonical URL - MUST point to the page's own absolute URL
    // This is critical for SEO - each page declares its own canonical
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
