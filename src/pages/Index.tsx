import React from 'react';
import HomeCard from '@/components/HomeCard';
import { Calculator, CalendarDays, ChartBar, LayoutDashboard } from 'lucide-react';
const Index = () => {
  return <div className="min-h-screen bg-muted/30">
      <div className="py-12 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-primary">Gestion des Tarifs Hôteliers</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une solution complète pour calculer, vérifier et optimiser vos tarifs hôteliers
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <HomeCard title="Calculer un Tarif" description="Calculez les tarifs pour différentes catégories et plans" icon={<Calculator className="w-8 h-8 text-primary" />} to="/calculate-rate" />
            
            <HomeCard title="Vérifier une Réservation" description="Vérifiez et validez les tarifs des réservations" icon={<CalendarDays className="w-8 h-8 text-primary" />} to="/verify-booking" />
            
            <HomeCard title="Suivi des Tarifs" description="Visualisez et suivez l'évolution de vos tarifs" icon={<ChartBar className="w-8 h-8 text-primary" />} to="/track-rates" />
            
            <HomeCard title="Yield Management" description="Optimisez vos revenus avec des suggestions tarifaires" icon={<LayoutDashboard className="w-8 h-8 text-primary" />} to="/yield-management" />
          </div>
        </div>
      </div>
    </div>;
};
export default Index;