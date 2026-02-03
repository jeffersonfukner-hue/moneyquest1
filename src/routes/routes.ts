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

// Authenticated pages (app) - Gamification removed
export const APP_ROUTES = {
  DASHBOARD: '/dashboard',
  WALLETS: '/wallets',
  CATEGORY_GOALS: '/category-goals',
  CATEGORIES: '/categories',
  CASH_FLOW: '/cash-flow',
  PERIOD_COMPARISON: '/period-comparison',
  SCHEDULED: '/scheduled',
  SUPPLIERS: '/suppliers',
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
