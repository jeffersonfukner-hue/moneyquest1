/**
 * Centralized Route Constants
 * Single source of truth for all routes in the application
 * 
 * Usage:
 * import { APP_ROUTES, PUBLIC_ROUTES } from '@/routes/routes';
 * navigate(APP_ROUTES.DASHBOARD);
 */

// Public pages (unauthenticated)
export const PUBLIC_ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  FEATURES: '/features',
  ABOUT: '/about',
  TERMS: '/terms',
  PRIVACY: '/privacy',
  BLOG: '/blog',
  AUTHOR: '/autor',
  // SEO landing pages
  CONTROLE_FINANCEIRO: '/controle-financeiro',
  EDUCACAO_FINANCEIRA: '/educacao-financeira-gamificada',
  DESAFIOS_FINANCEIROS: '/desafios-financeiros',
  APP_FINANCAS: '/app-financas-pessoais',
  // Language selection
  SELECT_LANGUAGE: '/select-language',
  // Referral redirect
  REFERRAL_REDIRECT: '/r',
} as const;

// Authenticated pages (app) - Clean routes
export const APP_ROUTES = {
  DASHBOARD: '/dashboard',
  // Wallets section with sub-routes
  WALLETS: '/wallets',
  WALLETS_ACCOUNTS: '/wallets/accounts',
  WALLETS_CARDS: '/wallets/cards',
  WALLETS_CHECKS: '/wallets/checks',
  WALLETS_LOANS: '/wallets/loans',
  WALLETS_TRANSFERS: '/wallets/transfers',
  // Other sections
  SCHEDULED: '/scheduled',
  SUPPLIERS: '/suppliers',
  GOALS: '/goals',
  REPORTS: '/reports',
  CATEGORIES: '/categories',
  SETTINGS: '/settings',
  SUPPORT: '/support',
  SUPPORT_TICKET: '/support/ticket',
  PROFILE: '/profile',
  NOTIFICATIONS: '/notifications',
  REFERRAL: '/referral',
  UPGRADE: '/upgrade',
  PREMIUM_SUCCESS: '/premium-success',
  ONBOARDING: '/onboarding',
  MY_MESSAGES: '/my-messages',
} as const;

// Admin routes
export const ADMIN_ROUTES = {
  DASHBOARD: '/super-admin',
  USERS: '/super-admin/users',
  TRAFFIC: '/super-admin/traffic',
  CAMPAIGNS: '/super-admin/campaigns',
  SUPPORT: '/super-admin/support',
  COMMENTS: '/super-admin/comments',
  REFERRALS: '/super-admin/referrals',
  TRIAL_ABUSE: '/super-admin/trial-abuse',
  ENGAGEMENT: '/super-admin/engagement',
  LOGS: '/super-admin/logs',
  SCORING_AUDIT: '/super-admin/scoring-audit',
} as const;

// Legacy route mappings (for redirects)
export const LEGACY_ROUTES: Record<string, string> = {
  '/wallets?tab=accounts': APP_ROUTES.WALLETS_ACCOUNTS,
  '/wallets?tab=cards': APP_ROUTES.WALLETS_CARDS,
  '/wallets?tab=loans': APP_ROUTES.WALLETS_LOANS,
  '/category-goals': APP_ROUTES.GOALS,
  '/cash-flow': APP_ROUTES.REPORTS,
  '/period-comparison': APP_ROUTES.REPORTS,
} as const;

// Type helpers
export type AppRoute = typeof APP_ROUTES[keyof typeof APP_ROUTES];
export type PublicRoute = typeof PUBLIC_ROUTES[keyof typeof PUBLIC_ROUTES];
export type AdminRoute = typeof ADMIN_ROUTES[keyof typeof ADMIN_ROUTES];

/**
 * Check if a path is an authenticated route
 */
export const isAppRoute = (path: string): boolean => {
  return Object.values(APP_ROUTES).some(
    route => path === route || path.startsWith(`${route}/`)
  );
};

/**
 * Check if a path is a public route
 */
export const isPublicRoute = (path: string): boolean => {
  return Object.values(PUBLIC_ROUTES).some(
    route => path === route || (route !== '/' && path.startsWith(`${route}/`))
  );
};

/**
 * Check if a path is an admin route
 */
export const isAdminRoute = (path: string): boolean => {
  return path.startsWith('/super-admin');
};

/**
 * Check if a path is a wallets sub-route
 */
export const isWalletsRoute = (path: string): boolean => {
  return path.startsWith('/wallets');
};
