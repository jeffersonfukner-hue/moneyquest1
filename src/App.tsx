import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { FinancialMoodProvider } from "@/contexts/FinancialMoodContext";
import { SeasonalThemeProvider } from "@/contexts/SeasonalThemeContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { OnboardingGuard } from "@/components/auth/OnboardingGuard";
import { LanguageGuard } from "@/components/auth/LanguageGuard";
import { FingerprintCapture } from "@/components/auth/FingerprintCapture";
import { SEOProvider } from "@/components/SEOProvider";
import '@/i18n';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import LanguageSelection from "./pages/LanguageSelection";
import Features from "./pages/Features";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";

// SEO Pages
import ControleFinanceiro from "./pages/ControleFinanceiro";
import EducacaoFinanceira from "./pages/EducacaoFinanceira";
import DesafiosFinanceiros from "./pages/DesafiosFinanceiros";
import AppFinancasPessoais from "./pages/AppFinancasPessoais";

import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Upgrade from "./pages/Upgrade";
import PremiumSuccess from "./pages/PremiumSuccess";
import AICoach from "./pages/AICoach";
import CategoryGoals from "./pages/CategoryGoals";
import Categories from "./pages/Categories";
import Leaderboard from "./pages/Leaderboard";
import AdventureJournal from "./pages/AdventureJournal";
import Wallets from "./pages/Wallets";
import CashFlow from "./pages/CashFlow";
import PeriodComparison from "./pages/PeriodComparison";
import Support from "./pages/Support";
import MyMessages from "./pages/MyMessages";
import SupportTicket from "./pages/SupportTicket";
import Referral from "./pages/Referral";
import ReferralRedirect from "./pages/ReferralRedirect";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import DebugI18n from "./pages/DebugI18n";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import CampaignsManagement from "./pages/admin/CampaignsManagement";
import EngagementAlerts from "./pages/admin/EngagementAlerts";
import AdminLogs from "./pages/admin/AdminLogs";
import SupportTickets from "./pages/admin/SupportTickets";
import SuspiciousReferrals from "./pages/admin/SuspiciousReferrals";
import TrialAbuse from "./pages/admin/TrialAbuse";
import { AdminRoute } from "./components/admin/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <ThemeProvider>
          <SoundProvider>
            <LanguageProvider>
              <CurrencyProvider>
                <SubscriptionProvider>
                  <FinancialMoodProvider>
                    <SeasonalThemeProvider>
                      <Toaster />
                      <Sonner />
                      <FingerprintCapture />
                      <BrowserRouter>
                        <SEOProvider>
                          <Routes>
                            <Route path="/select-language" element={<LanguageSelection />} />
                            <Route path="/" element={<OnboardingGuard><Index /></OnboardingGuard>} />
                          <Route path="/setup" element={<Navigate to="/signup" replace />} />
                          <Route path="/login" element={<LanguageGuard><Login /></LanguageGuard>} />
                          <Route path="/signup" element={<LanguageGuard><Signup /></LanguageGuard>} />
                          <Route path="/features" element={<LanguageGuard><Features /></LanguageGuard>} />
                          <Route path="/terms" element={<LanguageGuard><Terms /></LanguageGuard>} />
                          <Route path="/privacy" element={<LanguageGuard><Privacy /></LanguageGuard>} />
                          {/* SEO Landing Pages */}
                          <Route path="/controle-financeiro" element={<ControleFinanceiro />} />
                          <Route path="/educacao-financeira-gamificada" element={<EducacaoFinanceira />} />
                          <Route path="/desafios-financeiros" element={<DesafiosFinanceiros />} />
                          <Route path="/app-financas-pessoais" element={<AppFinancasPessoais />} />
                          <Route path="/onboarding" element={<Onboarding />} />
                          <Route path="/auth" element={<Navigate to="/login" replace />} />
                          <Route path="/settings" element={<Settings />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/premium" element={<Upgrade />} />
                          <Route path="/premium-success" element={<PremiumSuccess />} />
                          <Route path="/upgrade" element={<Navigate to="/premium" replace />} />
                          <Route path="/ai-coach" element={<AICoach />} />
                          <Route path="/category-goals" element={<CategoryGoals />} />
                          <Route path="/categories" element={<Categories />} />
                          <Route path="/leaderboard" element={<Leaderboard />} />
                          <Route path="/journal" element={<AdventureJournal />} />
                          <Route path="/wallets" element={<Wallets />} />
                          <Route path="/cash-flow" element={<CashFlow />} />
                          <Route path="/period-comparison" element={<PeriodComparison />} />
                          <Route path="/support" element={<Support />} />
                          <Route path="/support/messages" element={<MyMessages />} />
                          <Route path="/support/ticket/:id" element={<SupportTicket />} />
                          <Route path="/referral" element={<Referral />} />
                          <Route path="/r/:code" element={<ReferralRedirect />} />
                          <Route path="/notifications" element={<Notifications />} />
                          <Route path="/debug-i18n" element={<DebugI18n />} />
                          {/* Admin Routes */}
                          <Route path="/super-admin" element={<AdminRoute><SuperAdminDashboard /></AdminRoute>} />
                          <Route path="/super-admin/users" element={<AdminRoute><UsersManagement /></AdminRoute>} />
                          <Route path="/super-admin/campaigns" element={<AdminRoute><CampaignsManagement /></AdminRoute>} />
                          <Route path="/super-admin/support" element={<AdminRoute><SupportTickets /></AdminRoute>} />
                          <Route path="/super-admin/referrals" element={<AdminRoute><SuspiciousReferrals /></AdminRoute>} />
                          <Route path="/super-admin/trial-abuse" element={<AdminRoute><TrialAbuse /></AdminRoute>} />
                          <Route path="/super-admin/engagement" element={<AdminRoute><EngagementAlerts /></AdminRoute>} />
                          <Route path="/super-admin/analytics" element={<AdminRoute><SuperAdminDashboard /></AdminRoute>} />
                          <Route path="/super-admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </SEOProvider>
                    </BrowserRouter>
                    </SeasonalThemeProvider>
                  </FinancialMoodProvider>
                </SubscriptionProvider>
              </CurrencyProvider>
            </LanguageProvider>
          </SoundProvider>
        </ThemeProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
