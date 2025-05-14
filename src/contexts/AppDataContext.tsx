
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

type Category = {
  id: string;
  name: string;
};

type Plan = {
  id: string;
  code: string;
  description: string | null;
};

type Partner = {
  id: string;
  name: string;
};

type PartnerPlan = {
  partner_id: string;
  plan_id: string;
};

type PartnerAdjustment = {
  id: string;
  partner_id: string;
  description: string;
  ui_control: string;
  adjustment_type: string;
  adjustment_value: string | null;
  default_checked: boolean;
  associated_plan_filter: string | null;
};

interface AppDataContextType {
  categories: Category[];
  plans: Plan[];
  partners: Partner[];
  partnerPlans: PartnerPlan[];
  partnerAdjustments: PartnerAdjustment[];
  loading: boolean;
  getPartnerPlans: (partnerId: string) => string[];
  getPlanCategories: (planId: string) => string[]; // Temporaire, à remplacer par une vraie logique
  getPartnerAdjustments: (partnerId: string, planId?: string) => PartnerAdjustment[];
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [partnerPlans, setPartnerPlans] = useState<PartnerPlan[]>([]);
  const [partnerAdjustments, setPartnerAdjustments] = useState<PartnerAdjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Récupérer toutes les données nécessaires en parallèle
        const [
          { data: categoriesData, error: categoriesError },
          { data: plansData, error: plansError },
          { data: partnersData, error: partnersError },
          { data: partnerPlansData, error: partnerPlansError },
          { data: partnerAdjustmentsData, error: partnerAdjustmentsError }
        ] = await Promise.all([
          supabase.from('categories').select('*'),
          supabase.from('plans').select('*'),
          supabase.from('partners').select('*'),
          supabase.from('partner_plans').select('*'),
          supabase.from('partner_adjustments').select('*')
        ]);

        if (categoriesError) throw categoriesError;
        if (plansError) throw plansError;
        if (partnersError) throw partnersError;
        if (partnerPlansError) throw partnerPlansError;
        if (partnerAdjustmentsError) throw partnerAdjustmentsError;

        setCategories(categoriesData || []);
        setPlans(plansData || []);
        setPartners(partnersData || []);
        setPartnerPlans(partnerPlansData || []);
        setPartnerAdjustments(partnerAdjustmentsData || []);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les données nécessaires",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  // Obtenir les plans associés à un partenaire
  const getPartnerPlans = (partnerId: string): string[] => {
    const planIds = partnerPlans
      .filter(pp => pp.partner_id === partnerId)
      .map(pp => pp.plan_id);
    
    return planIds;
  };

  // Temporaire: association plan -> catégories (à remplacer par une vraie logique)
  // Dans une vraie implémentation, cela pourrait venir d'une table de jonction dans la base de données
  const getPlanCategories = (planId: string): string[] => {
    // Simulation: chaque plan peut accéder à toutes les catégories pour l'instant
    return categories.map(category => category.id);
  };

  // Obtenir les ajustements pour un partenaire, filtré par plan si spécifié
  const getPartnerAdjustments = (partnerId: string, planId?: string): PartnerAdjustment[] => {
    return partnerAdjustments.filter(adjustment => {
      const isPartnerMatch = adjustment.partner_id === partnerId;
      
      if (!planId || !adjustment.associated_plan_filter) {
        return isPartnerMatch;
      }
      
      // Si un planId est fourni et l'ajustement a un filtre de plan associé
      return isPartnerMatch && adjustment.associated_plan_filter === planId;
    });
  };

  const value = {
    categories,
    plans,
    partners,
    partnerPlans,
    partnerAdjustments,
    loading,
    getPartnerPlans,
    getPlanCategories,
    getPartnerAdjustments
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error("useAppData doit être utilisé à l'intérieur d'un AppDataProvider");
  }
  return context;
};
