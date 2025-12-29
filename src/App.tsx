import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { FinancialMoodProvider } from "@/contexts/FinancialMoodContext";
import { SeasonalThemeProvider } from "@/contexts/SeasonalThemeContext";
import { SoundProvider } from "@/contexts/SoundContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import '@/i18n';
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Upgrade from "./pages/Upgrade";
import AICoach from "./pages/AICoach";
import CategoryGoals from "./pages/CategoryGoals";
import Categories from "./pages/Categories";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";
import SuperAdminDashboard from "./pages/admin/SuperAdminDashboard";
import UsersManagement from "./pages/admin/UsersManagement";
import EngagementAlerts from "./pages/admin/EngagementAlerts";
import AdminLogs from "./pages/admin/AdminLogs";
import { AdminRoute } from "./components/admin/AdminRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SoundProvider>
          <LanguageProvider>
            <CurrencyProvider>
              <SubscriptionProvider>
                <FinancialMoodProvider>
                  <SeasonalThemeProvider>
                    <Toaster />
                    <Sonner />
                    <BrowserRouter>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/auth" element={<Auth />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/upgrade" element={<Upgrade />} />
                        <Route path="/ai-coach" element={<AICoach />} />
                        <Route path="/category-goals" element={<CategoryGoals />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/leaderboard" element={<Leaderboard />} />
                        {/* Admin Routes */}
                        <Route path="/super-admin" element={<AdminRoute><SuperAdminDashboard /></AdminRoute>} />
                        <Route path="/super-admin/users" element={<AdminRoute><UsersManagement /></AdminRoute>} />
                        <Route path="/super-admin/engagement" element={<AdminRoute><EngagementAlerts /></AdminRoute>} />
                        <Route path="/super-admin/logs" element={<AdminRoute><AdminLogs /></AdminRoute>} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </BrowserRouter>
                  </SeasonalThemeProvider>
                </FinancialMoodProvider>
              </SubscriptionProvider>
            </CurrencyProvider>
          </LanguageProvider>
        </SoundProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
