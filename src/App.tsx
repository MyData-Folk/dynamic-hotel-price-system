
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Index from "./pages/Index";
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
        <div className="flex flex-col min-h-screen">
          <NavBar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/calculate-rate" element={<CalculateRate />} />
              <Route path="/verify-booking" element={<VerifyBooking />} />
              <Route path="/track-rates" element={<TrackRates />} />
              <Route path="/yield-management" element={<YieldManagement />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <footer className="bg-primary text-primary-foreground py-4 px-6 text-center mt-auto">
            <p className="text-sm">© {new Date().getFullYear()} HotelRate Pro - Application de Gestion des Tarifs Hôteliers</p>
          </footer>
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
