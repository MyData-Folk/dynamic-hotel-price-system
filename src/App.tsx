
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import NavBar from "./components/NavBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CalculateRate from "./pages/CalculateRate";
import VerifyBooking from "./pages/VerifyBooking";
import TrackRates from "./pages/TrackRates";
import YieldManagement from "./pages/YieldManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/calculate-rate" element={
                  <ProtectedRoute>
                    <CalculateRate />
                  </ProtectedRoute>
                } />
                <Route path="/verify-booking" element={
                  <ProtectedRoute>
                    <VerifyBooking />
                  </ProtectedRoute>
                } />
                <Route path="/track-rates" element={
                  <ProtectedRoute>
                    <TrackRates />
                  </ProtectedRoute>
                } />
                <Route path="/yield-management" element={
                  <ProtectedRoute>
                    <YieldManagement />
                  </ProtectedRoute>
                } />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <footer className="bg-primary text-primary-foreground py-4 px-6 text-center mt-auto">
              <p className="text-sm">© {new Date().getFullYear()} HotelRate Pro - Application de Gestion des Tarifs Hôteliers</p>
            </footer>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
