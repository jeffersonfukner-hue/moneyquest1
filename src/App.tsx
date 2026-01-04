import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SoundProvider } from "@/contexts/SoundContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageGuard } from "@/components/auth/LanguageGuard";
import { SEOProviderPublic } from "@/components/SEOProviderPublic";
import '@/i18n';
import { Gamepad2 } from 'lucide-react';

// ===== CRITICAL PUBLIC PAGES - Loaded immediately for fast LCP =====
// Only the absolute minimum for first paint
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// ===== LAZY LOADED - Public pages (non-critical) =====
const LazyIndex = lazy(() => import("./pages/Index"));
const LazyLanguageSelection = lazy(() => import("./pages/LanguageSelection"));
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
const LazyAICoach = lazy(() => import("./pages/AICoach"));
const LazyCategoryGoals = lazy(() => import("./pages/CategoryGoals"));
const LazyCategories = lazy(() => import("./pages/Categories"));
const LazyLeaderboard = lazy(() => import("./pages/Leaderboard"));
const LazyAdventureJournal = lazy(() => import("./pages/AdventureJournal"));
const LazyWallets = lazy(() => import("./pages/Wallets"));
const LazyCashFlow = lazy(() => import("./pages/CashFlow"));
const LazyPeriodComparison = lazy(() => import("./pages/PeriodComparison"));
const LazySupport = lazy(() => import("./pages/Support"));
const LazyMyMessages = lazy(() => import("./pages/MyMessages"));
const LazySupportTicket = lazy(() => import("./pages/SupportTicket"));
const LazyReferral = lazy(() => import("./pages/Referral"));
const LazyNotifications = lazy(() => import("./pages/Notifications"));
const LazyDebugI18n = lazy(() => import("./pages/DebugI18n"));

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
    <LazyFingerprintCapture />
    <LazyCurrencyProvider>
      <LazySubscriptionProvider>
        <LazyFinancialMoodProvider>
          <LazySeasonalThemeProvider>
            <LazySEOProvider>
              {children}
            </LazySEOProvider>
          </LazySeasonalThemeProvider>
        </LazyFinancialMoodProvider>
      </LazySubscriptionProvider>
    </LazyCurrencyProvider>
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
              <BrowserRouter>
                <Routes>
                  {/* ===== PUBLIC ROUTES - Fast loading, minimal providers ===== */}
                  <Route path="/select-language" element={
                    <SEOProviderPublic><Suspense fallback={<PageLoader />}><LazyLanguageSelection /></Suspense></SEOProviderPublic>
                  } />
                  
                  {/* Home - Special case, needs onboarding guard */}
                  <Route path="/" element={
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
                  <Route path="/ai-coach" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyAICoach /></Suspense>
                    </AuthenticatedWrapper>
                  } />
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
                  <Route path="/leaderboard" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyLeaderboard /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/journal" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyAdventureJournal /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/wallets" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyWallets /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/cash-flow" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyCashFlow /></Suspense>
                    </AuthenticatedWrapper>
                  } />
                  <Route path="/period-comparison" element={
                    <AuthenticatedWrapper>
                      <Suspense fallback={<PageLoader />}><LazyPeriodComparison /></Suspense>
                    </AuthenticatedWrapper>
                  } />
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
                  <Route path="/debug-i18n" element={
                    <Suspense fallback={<PageLoader />}><LazyDebugI18n /></Suspense>
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
