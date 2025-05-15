import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { PlanRule, CategoryRule } from "@/types/calculateRate.types";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function useRules() {
  const [planRules, setPlanRules] = useState<PlanRule | null>(null);
  const [categoryRules, setCategoryRules] = useState<CategoryRule | null>(null);
  const { toast } = useToast();

  // Fetch plan rules
  const fetchPlanRules = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('plan_rules')
        .select('*')
        .eq('plan_id', planId)
        .single();

      if (error) {
        console.error("Erreur lors du chargement des règles de plan:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les règles du plan",
          variant: "destructive",
        });
        return;
      }

      setPlanRules(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les règles du plan",
        variant: "destructive",
      });
    }
  };

  // Fetch category rules
  const fetchCategoryRules = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('category_rules')
        .select('*')
        .eq('category_id', categoryId)
        .maybeSingle(); // Using maybeSingle() instead of single() to avoid errors

      if (error) {
        console.error("Erreur lors du chargement des règles de catégorie:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les règles de catégorie",
          variant: "destructive",
        });
        return;
      }

      setCategoryRules(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les règles de catégorie",
        variant: "destructive",
      });
    }
  };

  // Fetch daily base rate from the daily_base_rates table
  const fetchDailyBaseRate = async (date: Date, baseSource: string) => {
    try {
      // Format the date to YYYY-MM-DD for database query
      const formattedDate = date.toISOString().split('T')[0];
      
      console.log(`Recherche du tarif pour la date ${formattedDate}, source: ${baseSource}`);
      
      const { data, error } = await supabase
        .from('daily_base_rates')
        .select('*')
        .eq('date', formattedDate)
        .maybeSingle();

      if (error || !data) {
        console.error(`Pas de tarif disponible pour la date ${formattedDate}:`, error);
        toast({
          title: "Avertissement",
          description: `Aucun tarif trouvé pour le ${format(date, 'dd/MM/yyyy', {locale: fr})}`,
          variant: "destructive",
        });
        return 0; // Return 0 if no rate is found
      }

      // Return the appropriate rate based on baseSource (either 'ota_rate' or 'travco_rate')
      console.log(`Tarif trouvé: ${baseSource === 'ota_rate' ? data.ota_rate : data.travco_rate}`);
      return baseSource === 'ota_rate' ? data.ota_rate : data.travco_rate;
    } catch (error) {
      console.error("Erreur lors de la récupération du tarif de base:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer le tarif de base",
        variant: "destructive",
      });
      return 0;
    }
  };

  return {
    planRules,
    categoryRules,
    fetchPlanRules,
    fetchCategoryRules,
    fetchDailyBaseRate,
    setPlanRules,
    setCategoryRules
  };
}
