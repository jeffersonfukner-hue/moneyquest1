import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

interface SEOConfig {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  noIndex?: boolean;
}

const BASE_URL = 'https://www.moneyquest.app.br';
const DEFAULT_IMAGE = `${BASE_URL}/og-image.png`;
const SITE_NAME = 'MoneyQuest';
const TWITTER_HANDLE = '@moneyquestapp';

// Page-specific SEO configurations
const pageConfigs: Record<string, SEOConfig> = {
  '/': {
    title: 'MoneyQuest - Gamifique suas Finanças',
    description: 'Transforme o controle financeiro em uma aventura! Ganhe XP, complete missões, suba de nível e conquiste suas metas financeiras de forma divertida.',
  },
  '/login': {
    title: 'Entrar | MoneyQuest',
    description: 'Faça login na sua conta MoneyQuest e continue sua jornada financeira. Acompanhe seus gastos, metas e conquistas.',
    noIndex: true,
  },
  '/signup': {
    title: 'Criar Conta | MoneyQuest',
    description: 'Comece sua aventura financeira! Crie sua conta gratuita no MoneyQuest e transforme o controle de gastos em um jogo divertido.',
  },
  '/onboarding': {
    title: 'Configuração Inicial | MoneyQuest',
    description: 'Configure sua conta MoneyQuest e personalize sua experiência financeira.',
    noIndex: true,
  },
  '/premium': {
    title: 'MoneyQuest Premium - Recursos Exclusivos',
    description: 'Desbloqueie todo o potencial do MoneyQuest! Relatórios avançados, IA Coach, temas exclusivos e muito mais.',
  },
  '/ai-coach': {
    title: 'Coach Financeiro IA | MoneyQuest',
    description: 'Receba conselhos personalizados de um coach financeiro inteligente. Análise de gastos, sugestões de economia e planejamento financeiro.',
  },
  '/category-goals': {
    title: 'Metas por Categoria | MoneyQuest',
    description: 'Defina e acompanhe metas de orçamento para cada categoria de gastos. Mantenha suas finanças sob controle.',
  },
  '/categories': {
    title: 'Categorias | MoneyQuest',
    description: 'Gerencie suas categorias de receitas e despesas. Organize suas transações de forma personalizada.',
  },
  '/leaderboard': {
    title: 'Ranking | MoneyQuest',
    description: 'Veja sua posição no ranking global! Compare seu progresso com outros jogadores e suba de nível.',
  },
  '/journal': {
    title: 'Diário de Aventuras | MoneyQuest',
    description: 'Acompanhe sua jornada financeira com narrativas personalizadas e marcos importantes.',
  },
  '/wallets': {
    title: 'Carteiras | MoneyQuest',
    description: 'Gerencie todas as suas contas e carteiras em um só lugar. Acompanhe saldos e movimentações.',
  },
  '/cash-flow': {
    title: 'Fluxo de Caixa | MoneyQuest',
    description: 'Visualize seu fluxo de caixa com gráficos detalhados. Entenda para onde vai seu dinheiro.',
  },
  '/period-comparison': {
    title: 'Comparação de Períodos | MoneyQuest',
    description: 'Compare seus gastos entre diferentes períodos. Identifique tendências e otimize suas finanças.',
  },
  '/settings': {
    title: 'Configurações | MoneyQuest',
    description: 'Personalize sua experiência no MoneyQuest. Ajuste preferências, notificações e muito mais.',
    noIndex: true,
  },
  '/profile': {
    title: 'Perfil | MoneyQuest',
    description: 'Visualize e edite seu perfil MoneyQuest. Acompanhe seu nível, XP e conquistas.',
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

    // Robots
    if (config.noIndex) {
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
