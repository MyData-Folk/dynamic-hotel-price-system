import React, { useState, useEffect } from 'react';
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppData } from '@/contexts/AppDataContext';
import { useToast } from "@/components/ui/use-toast";
import { FormValues, CalculationResult } from "@/types/calculateRate.types";
import { useRules } from "@/hooks/useRules";
import { calculateRate } from "@/utils/rateCalculator";
import { RateForm } from "@/components/calculate-rate/RateForm";
import { ResultDisplay } from "@/components/calculate-rate/ResultDisplay";

const CalculateRate = () => {
  const { 
    partners, 
    plans, 
    categories, 
    loading, 
    getPartnerPlans,
    getPlanCategories,
    getPartnerAdjustments 
  } = useAppData();
  
  const [availablePlans, setAvailablePlans] = useState<typeof plans>([]);
  const [availableCategories, setAvailableCategories] = useState<typeof categories>([]);
  const [partnerAdjustments, setPartnerAdjustments] = useState<any[]>([]);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const { toast } = useToast();
  const { 
    planRules, 
    categoryRules,
    fetchPlanRules,
    fetchCategoryRules,
    fetchDailyBaseRate
  } = useRules();

  // Handle form submission
  const handleSubmit = async (values: FormValues) => {
    try {
      const result = await calculateRate({
        values,
        planRules,
        categoryRules,
        partnerAdjustments,
        fetchDailyBaseRate,
        partners,
        plans,
        categories
      });
      
      setCalculationResult(result);
      
      toast({
        title: "Calcul effectué",
        description: "Le tarif a été calculé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors du calcul du tarif:", error);
      toast({
        title: "Erreur",
        description: "Impossible de calculer le tarif",
        variant: "destructive",
      });
    }
  };

  // Load plan rules when plan changes
  const handlePlanChange = (planId: string) => {
    if (planId) {
      fetchPlanRules(planId);
    }
  };

  // Load category rules when category changes
  const handleCategoryChange = (categoryId: string) => {
    if (categoryId) {
      fetchCategoryRules(categoryId);
    }
  };

  // Watch for plan and category changes
  useEffect(() => {
    const subscription = () => {
      // This is a placeholder for the subscription setup
      // It will be called when the component mounts
      return () => {
        // Cleanup function
      };
    };

    return subscription();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Calculer un Tarif</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Formulaire de Calcul</CardTitle>
              <CardDescription>
                Remplissez les informations pour calculer le tarif d'un séjour
              </CardDescription>
            </CardHeader>
            <RateForm
              partners={partners}
              plans={plans}
              categories={categories}
              loading={loading}
              availablePlans={availablePlans}
              availableCategories={availableCategories}
              partnerAdjustments={partnerAdjustments}
              getPartnerPlans={getPartnerPlans}
              getPlanCategories={getPlanCategories}
              getPartnerAdjustments={getPartnerAdjustments}
              setAvailablePlans={setAvailablePlans}
              setAvailableCategories={setAvailableCategories}
              setPartnerAdjustments={setPartnerAdjustments}
              onSubmit={handleSubmit}
            />
          </Card>
        </div>

        {/* Résultat du calcul */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Résultat du calcul</CardTitle>
              <CardDescription>
                Détails du tarif calculé
              </CardDescription>
            </CardHeader>
            <ResultDisplay calculationResult={calculationResult} />
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalculateRate;
