import { lazy, Suspense, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SoundProvider } from "@/contexts/SoundContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProfileProvider } from "@/contexts/ProfileContext";
import { LanguageGuard } from "@/components/auth/LanguageGuard";
import { SEOProviderPublic } from "@/components/SEOProviderPublic";
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";
import '@/i18n';
import { Gamepad2 } from 'lucide-react';
import { AuthStatusIndicator } from '@/components/debug/AuthStatusIndicator';

// Prefetch common chunks after initial load for faster navigation
const prefetchCommonChunks = () => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(() => {
      // Prefetch likely navigation targets
      import('./pages/Features');
      import('./pages/Blog');
    }, { timeout: 5000 });
  }
};

// Execute prefetch after initial render
if (typeof window !== 'undefined') {
  window.addEventListener('load', prefetchCommonChunks, { once: true });
}

// ===== CRITICAL PUBLIC PAGES - Loaded immediately for fast LCP =====
// Only the absolute minimum for first paint
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home"; // Eagerly loaded for LCP optimization

// ===== LAZY LOADED - Public pages (non-critical) =====
const LazyIndex = lazy(() => import("./pages/Index"));
// Rota de seleção de idioma removida - idioma fixo em pt-BR
const LazyFeatures = lazy(() => import("./pages/Features"));
const LazyAbout = lazy(() => import("./pages/About"));
const LazyTerms = lazy(() => import("./pages/Terms"));
const LazyPrivacy = lazy(() => import("./pages/Privacy"));
const LazyNotFound = lazy(() => import("./pages/NotFound"));

// ===== LAZY LOADED - SEO Landing Pages =====
const LazyControleFinanceiro = lazy(() => import("./pages/ControleFinanceiro"));
const LazyEducacaoFinanceira = lazy(() => import("./pages/EducacaoFinanceira"));
const LazyDesafiosFinanceiros = lazy(() => import("./pages/DesafiosFinanceiros"));
const LazyAppFinancasPessoais = lazy(() => import("./pages/AppFinancasPessoais"));

// ===== LAZY LOADED - Blog =====
const LazyBlog = lazy(() => import("./pages/Blog"));
const LazyBlogArticle = lazy(() => import("./pages/BlogArticle"));
const LazyAuthor = lazy(() => import("./pages/Author"));
const LazySitemapRedirect = lazy(() => import("./pages/SitemapRedirect"));
const LazyReferralRedirect = lazy(() => import("./pages/ReferralRedirect"));

// ===== LAZY LOADED - App pages (authenticated) =====
const LazyOnboarding = lazy(() => import("./pages/Onboarding"));
const LazySettings = lazy(() => import("./pages/Settings"));
const LazyProfile = lazy(() => import("./pages/Profile"));
const LazyUpgrade = lazy(() => import("./pages/Upgrade"));
const LazyPremiumSuccess = lazy(() => import("./pages/PremiumSuccess"));
// AI Coach desativado na versão sem IA - rota redirecionará para home
const LazyCategoryGoals = lazy(() => import("./pages/CategoryGoals"));
const LazyCategories = lazy(() => import("./pages/Categories"));
const LazyWalletsRouter = lazy(() => import("./pages/WalletsRouter"));
const LazyScheduledTransactions = lazy(() => import("./pages/ScheduledTransactions"));
const LazyReportsRouter = lazy(() => import("./pages/ReportsRouter"));
const LazySupport = lazy(() => import("./pages/Support"));
const LazyMyMessages = lazy(() => import("./pages/MyMessages"));
const LazySupportTicket = lazy(() => import("./pages/SupportTicket"));
const LazyReferral = lazy(() => import("./pages/Referral"));
const LazyNotifications = lazy(() => import("./pages/Notifications"));
const LazyDebugI18n = lazy(() => import("./pages/DebugI18n"));
const LazyDebugAuth = lazy(() => import("./pages/DebugAuth"));
const LazyDebugSEO = lazy(() => import("./pages/DebugSEO"));
const LazySuppliers = lazy(() => import("./pages/Suppliers"));
const LazyReconciliation = lazy(() => import("./pages/ReconciliationPage"));
const LazyMonthlyClosing = lazy(() => import("./pages/MonthlyClosingPage"));
// ===== LAZY LOADED - Admin pages =====
const LazySuperAdminDashboard = lazy(() => import("./pages/admin/SuperAdminDashboard"));
const LazyUsersManagement = lazy(() => import("./pages/admin/UsersManagement"));
const LazyCampaignsManagement = lazy(() => import("./pages/admin/CampaignsManagement"));
const LazyEngagementAlerts = lazy(() => import("./pages/admin/EngagementAlerts"));
const LazyAdminLogs = lazy(() => import("./pages/admin/AdminLogs"));
const LazySupportTickets = lazy(() => import("./pages/admin/SupportTickets"));
const LazySuspiciousReferrals = lazy(() => import("./pages/admin/SuspiciousReferrals"));
const LazyTrialAbuse = lazy(() => import("./pages/admin/TrialAbuse"));
const LazyBlogCommentsModeration = lazy(() => import("./pages/admin/BlogCommentsModeration"));
const LazyTrafficAnalytics = lazy(() => import("./pages/admin/TrafficAnalytics"));
const LazyScoringAudit = lazy(() => import("./pages/admin/ScoringAudit"));

// ===== LAZY LOADED - Heavy providers (only for authenticated routes) =====
const LazyOnboardingGuard = lazy(() => import("@/components/auth/OnboardingGuard").then(m => ({ default: m.OnboardingGuard })));
const LazyAdminRoute = lazy(() => import("./components/admin/AdminRoute").then(m => ({ default: m.AdminRoute })));
const LazyFingerprintCapture = lazy(() => import("@/components/auth/FingerprintCapture").then(m => ({ default: m.FingerprintCapture })));
const LazyAuthGuard = lazy(() => import("@/components/auth/AuthGuard").then(m => ({ default: m.AuthGuard })));

// Lazy load heavy context providers - only needed for authenticated routes
const LazyFinancialMoodProvider = lazy(() => import("@/contexts/FinancialMoodContext").then(m => ({ default: m.FinancialMoodProvider })));
const LazySeasonalThemeProvider = lazy(() => import("@/contexts/SeasonalThemeContext").then(m => ({ default: m.SeasonalThemeProvider })));
const LazyCurrencyProvider = lazy(() => import("@/contexts/CurrencyContext").then(m => ({ default: m.CurrencyProvider })));
const LazySubscriptionProvider = lazy(() => import("@/contexts/SubscriptionContext").then(m => ({ default: m.SubscriptionProvider })));
const LazySEOProvider = lazy(() => import("@/components/SEOProvider").then(m => ({ default: m.SEOProvider })));

const queryClient = new QueryClient();

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-gradient-hero rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
        <Gamepad2 className="w-8 h-8 text-primary-foreground" />
      </div>
    </div>
  </div>
);

// Wrapper for authenticated routes with full providers
const AuthenticatedWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    <LazyAuthGuard>
      <ProfileProvider>
        <LazyFingerprintCapture />
        <LazyCurrencyProvider>
          <LazySubscriptionProvider>
            <LazyFinancialMoodProvider>
              <LazySeasonalThemeProvider>
                <LazySEOProvider>{children}</LazySEOProvider>
              </LazySeasonalThemeProvider>
            </LazyFinancialMoodProvider>
          </LazySubscriptionProvider>
        </LazyCurrencyProvider>
      </ProfileProvider>
    </LazyAuthGuard>
  </Suspense>
);

// Wrapper for admin routes
const AdminWrapper = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    <LazyAdminRoute>
      {children}
    </LazyAdminRoute>
  </Suspense>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider>
          <SoundProvider>
            <LanguageProvider>
              <Toaster />
              <Sonner />
              <PWAInstallBanner />
              <AuthStatusIndicator />
              <BrowserRouter>
                <Routes>
                  {/* Rota de seleção de idioma removida - redireciona para home */}
                  <Route path="/select-language" element={<Navigate to="/" replace />} />
                  
                  {/* Home - Public landing page for SEO and AdSense - Eagerly loaded for LCP */}
                  <Route path="/" element={
                    <SEOProviderPublic>
                      <LanguageGuard>
                        <Home />
                      </LanguageGuard>
                    </SEOProviderPublic>
                  } />
                  
                  {/* Dashboard - Authenticated app */}
                  <Route path="/dashboard" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}>
                        <LazyOnboardingGuard><LazyIndex /></LazyOnboardingGuard>
                      </Suspense>
                    </AuthenticatedWrapper>
                  } />
                  
                  <Route path="/setup" element={<Navigate to="/signup" replace />} />
                  
                  <Route path="/login" element={
                    <SEOProviderPublic><LanguageGuard><Login /></LanguageGuard></SEOProviderPublic>
                  } />
                  <Route path="/signup" element={
                    <SEOProviderPublic><LanguageGuard><Signup /></LanguageGuard></SEOProviderPublic>
                  } />
                  <Route path="/features" element={
                    <SEOProviderPublic><LanguageGuard><Suspense fallback={<PageLoader />}><LazyFeatures /></Suspense></LanguageGuard></SEOProviderPublic>
                  } />
                  <Route path="/about" element={
                    <SEOProviderPublic><LanguageGuard><Suspense fallback={<PageLoader />}><LazyAbout /></Suspense></LanguageGuard></SEOProviderPublic>
                  } />
                  <Route path="/terms" element={
                    <SEOProviderPublic><LanguageGuard><Suspense fallback={<PageLoader />}><LazyTerms /></Suspense></LanguageGuard></SEOProviderPublic>
                  } />
                  <Route path="/privacy" element={
                    <SEOProviderPublic><LanguageGuard><Suspense fallback={<PageLoader />}><LazyPrivacy /></Suspense></LanguageGuard></SEOProviderPublic>
                  } />
                  
                  {/* SEO Landing Pages */}
                  <Route path="/controle-financeiro" element={
                    <SEOProviderPublic><Suspense fallback={<PageLoader />}><LazyControleFinanceiro /></Suspense></SEOProviderPublic>
                  } />
                  <Route path="/educacao-financeira-gamificada" element={
                    <SEOProviderPublic><Suspense fallback={<PageLoader />}><LazyEducacaoFinanceira /></Suspense></SEOProviderPublic>
                  } />
                  <Route path="/desafios-financeiros" element={
                    <SEOProviderPublic><Suspense fallback={<PageLoader />}><LazyDesafiosFinanceiros /></Suspense></SEOProviderPublic>
                  } />
                  <Route path="/app-financas-pessoais" element={
                    <SEOProviderPublic><Suspense fallback={<PageLoader />}><LazyAppFinancasPessoais /></Suspense></SEOProviderPublic>
                  } />
                  
                  {/* Blog */}
                  <Route path="/blog" element={
                    <SEOProviderPublic><Suspense fallback={<PageLoader />}><LazyBlog /></Suspense></SEOProviderPublic>
                  } />
                  <Route path="/blog/:slug" element={
                    <SEOProviderPublic><Suspense fallback={<PageLoader />}><LazyBlogArticle /></Suspense></SEOProviderPublic>
                  } />
                  <Route path="/autor/:slug" element={
                    <SEOProviderPublic><Suspense fallback={<PageLoader />}><LazyAuthor /></Suspense></SEOProviderPublic>
                  } />
                  <Route path="/sitemap.xml" element={<Suspense fallback={null}><LazySitemapRedirect /></Suspense>} />
                  
                  {/* Referral redirect - public */}
                  <Route path="/r/:code" element={
                    <SEOProviderPublic><Suspense fallback={<PageLoader />}><LazyReferralRedirect /></Suspense></SEOProviderPublic>
                  } />
                  
                  {/* ===== AUTHENTICATED ROUTES - Lazy loaded ===== */}
                  <Route path="/onboarding" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyOnboarding /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/auth" element={<Navigate to="/login" replace />} />
                  <Route path="/settings" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazySettings /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/profile" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyProfile /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/premium" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyUpgrade /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/premium-success" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyPremiumSuccess /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/upgrade" element={<Navigate to="/premium" replace />} />
                  {/* AI Coach desativado - redireciona para home */}
                  <Route path="/ai-coach" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/category-goals" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyCategoryGoals /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/categories" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyCategories /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  {/* Gamification routes removed - redirect to dashboard */}
                  <Route path="/leaderboard" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/journal" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/shop" element={<Navigate to="/dashboard" replace />} />
                  
                  {/* Wallets routes - clean URLs with sub-routes */}
                  <Route path="/wallets" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyWalletsRouter /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/wallets/:tab" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyWalletsRouter /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/wallets/reconciliation" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyReconciliation /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/wallets/reconciliation/:walletId" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyReconciliation /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  
                  <Route path="/scheduled" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyScheduledTransactions /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  
                  {/* Reports - unified route, legacy redirects */}
                  <Route path="/reports" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyReportsRouter /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/reports/closing" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyMonthlyClosing /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/cash-flow" element={<Navigate to="/reports" replace />} />
                  <Route path="/period-comparison" element={<Navigate to="/reports?view=comparison" replace />} />
                  
                  {/* Goals - clean route (was category-goals) */}
                  <Route path="/goals" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyCategoryGoals /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/category-goals" element={<Navigate to="/goals" replace />} />
                  <Route path="/support" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazySupport /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/support/messages" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyMyMessages /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/support/ticket/:id" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazySupportTicket /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/referral" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyReferral /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/notifications" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyNotifications /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/suppliers" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazySuppliers /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/debug-i18n" element={
                    <Suspense fallback={<PageLoader />}><LazyDebugI18n /></Suspense>
                  } />
                  <Route path="/debug/auth" element={
                    <Suspense fallback={<PageLoader />}><LazyDebugAuth /></Suspense>
                  } />
                  <Route path="/debug-seo" element={
                    <Suspense fallback={<PageLoader />}><LazyDebugSEO /></Suspense>
                  } />
                  
                  {/* ===== ADMIN ROUTES - Lazy loaded ===== */}
                  <Route path="/super-admin" element={
                    <AuthenticatedWrapper>
                      <AdminWrapper><Suspense fallback={<PageLoader />}><LazySuperAdminDashboard /></Suspense></AdminWrapper>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/super-admin/users" element={
                    <AuthenticatedWrapper>
                      <AdminWrapper><Suspense fallback={<PageLoader />}><LazyUsersManagement /></Suspense></AdminWrapper>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/super-admin/traffic" element={
                    <AuthenticatedWrapper>
                      <AdminWrapper><Suspense fallback={<PageLoader />}><LazyTrafficAnalytics /></Suspense></AdminWrapper>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/super-admin/campaigns" element={
                    <AuthenticatedWrapper>
                      <AdminWrapper><Suspense fallback={<PageLoader />}><LazyCampaignsManagement /></Suspense></AdminWrapper>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/super-admin/support" element={
                    <AuthenticatedWrapper>
                      <AdminWrapper><Suspense fallback={<PageLoader />}><LazySupportTickets /></Suspense></AdminWrapper>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/super-admin/comments" element={
                    <AuthenticatedWrapper>
                      <AdminWrapper><Suspense fallback={<PageLoader />}><LazyBlogCommentsModeration /></Suspense></AdminWrapper>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/super-admin/referrals" element={
                    <AuthenticatedWrapper>
                      <AdminWrapper><Suspense fallback={<PageLoader />}><LazySuspiciousReferrals /></Suspense></AdminWrapper>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/super-admin/trial-abuse" element={
                    <AuthenticatedWrapper>
                      <AdminWrapper><Suspense fallback={<PageLoader />}><LazyTrialAbuse /></Suspense></AdminWrapper>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/super-admin/engagement" element={
                    <AuthenticatedWrapper>
                      <AdminWrapper><Suspense fallback={<PageLoader />}><LazyEngagementAlerts /></Suspense></AdminWrapper>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/super-admin/analytics" element={
                    <AuthenticatedWrapper>
                      <AdminWrapper><Suspense fallback={<PageLoader />}><LazySuperAdminDashboard /></Suspense></AdminWrapper>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/super-admin/logs" element={
                    <AuthenticatedWrapper>
                      <AdminWrapper><Suspense fallback={<PageLoader />}><LazyAdminLogs /></Suspense></AdminWrapper>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/super-admin/scoring-audit" element={
                    <AuthenticatedWrapper>
                      <AdminWrapper><Suspense fallback={<PageLoader />}><LazyScoringAudit /></Suspense></AdminWrapper>
                    </AuthenticatedWrapper>
                  } />
                  
                  {/* 404 */}
                  <Route path="*" element={<SEOProviderPublic><Suspense fallback={<PageLoader />}><LazyNotFound /></Suspense></SEOProviderPublic>} />
                </Routes>
              </BrowserRouter>
            </LanguageProvider>
          </SoundProvider>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
