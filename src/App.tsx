import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import Index from "./pages/Index";
import Subscriptions from "./pages/Subscriptions";
import Infrastructure from "./pages/Infrastructure";
import Credentials from "./pages/Credentials";
import Alerts from "./pages/Alerts";
import Costs from "./pages/Costs";
import Opportunities from "./pages/Opportunities";
import Reports from "./pages/Reports";
import SettingsPage from "./pages/SettingsPage";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={
              <ProtectedRoute>
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/assinaturas" element={<Subscriptions />} />
                    <Route path="/infraestrutura" element={<Infrastructure />} />
                    <Route path="/credenciais" element={<Credentials />} />
                    <Route path="/alertas" element={<Alerts />} />
                    <Route path="/custos" element={<Costs />} />
                    <Route path="/oportunidades" element={<Opportunities />} />
                    <Route path="/relatorios" element={<Reports />} />
                    <Route path="/configuracoes" element={<SettingsPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </ProtectedRoute>
            } />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
