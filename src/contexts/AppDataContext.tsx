
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { 
  Category, 
  Plan, 
  Partner, 
  PartnerAdjustment,
  AppDataContextType 
} from "@/types/appData.types";
import { fetchAllAppData } from "@/api/appDataApi";
import { processFetchedData } from "@/utils/appDataProcessor";
import { useAppDataHelpers } from "@/hooks/useAppDataHelpers";

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

/**
 * Provider component for AppData context
 */
export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State for processed data structures
  const [appDataState, setAppDataState] = useState<{
    allCategories: Set<string>; 
    allPlans: Set<string>; 
    allPartners: Set<string>;
    partnerToPlansMap: Map<string, Set<string>>; 
    planToCategoriesMap: Map<string, Set<string>>; 
    categoryToPlansMap: Map<string, Set<string>>;
    baseRatesByDate: Map<string, number>; 
    travcoBaseRatesByDate: Map<string, number>;
    categoryRulesMap: Map<string, any>; 
    planRulesMap: Map<string, any>; 
    partnerAdjustmentsMap: Map<string, PartnerAdjustment[]>;
    partnerNameToId: Map<string, string>; 
    categoryNameToId: Map<string, string>; 
    planCodeToId: Map<string, string>;
    partnerIdToName: Map<string, string>; 
    categoryIdToName: Map<string, string>; 
    planIdToCode: Map<string, string>;
  }>({
    allCategories: new Set(), 
    allPlans: new Set(), 
    allPartners: new Set(),
    partnerToPlansMap: new Map(), 
    planToCategoriesMap: new Map(), 
    categoryToPlansMap: new Map(),
    baseRatesByDate: new Map(), 
    travcoBaseRatesByDate: new Map(),
    categoryRulesMap: new Map(), 
    planRulesMap: new Map(), 
    partnerAdjustmentsMap: new Map(),
    partnerNameToId: new Map(), 
    categoryNameToId: new Map(), 
    planCodeToId: new Map(),
    partnerIdToName: new Map(), 
    categoryIdToName: new Map(), 
    planIdToCode: new Map(),
  });
  
  // State for raw data
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  // State for loading and errors
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const { toast } = useToast();
  
  // Get helper functions
  const { getPartnerPlans, getPlanCategories, getPartnerAdjustments } = useAppDataHelpers(appDataState);

  /**
   * Load all application data
   */
  const loadAppData = async () => {
    if (dataLoaded) {
      console.log("AppDataContext: Données déjà chargées et traitées. Skipping fetch.");
      return;
    }

    console.log("AppDataContext: Début du chargement initial des données depuis Supabase...");
    setError(null);
    setLoading(true);

    try {
      // Fetch all data
      const fetchedData = await fetchAllAppData();
      
      // Update raw data state
      setCategories(fetchedData.categories);
      setPlans(fetchedData.plans);
      setPartners(fetchedData.partners);

      // Process fetched data
      const { newState, missingPlanWarningsCount } = processFetchedData(fetchedData);
      
      // Update state with processed data
      setAppDataState(newState);

      // Show warnings based on data quality
      if (newState.baseRatesByDate.size === 0 && newState.travcoBaseRatesByDate.size === 0) {
        toast({ 
          title: "Avertissement", 
          description: "Aucun tarif de base valide trouvé. Le calcul sera limité.", 
          variant: "default" 
        });
      }
      
      if (newState.categoryRulesMap.size === 0) {
        toast({ 
          title: "Avertissement", 
          description: "Aucune règle de catégorie trouvée. Les calculs par catégorie pourraient être incorrects.", 
          variant: "default" 
        });
      }
      
      if (newState.planRulesMap.size === 0) {
        toast({ 
          title: "Avertissement", 
          description: "Aucune règle de plan trouvée. Les calculs de plans pourraient être incorrects.", 
          variant: "default" 
        });
      }
      
      if ([...newState.partnerAdjustmentsMap.values()].flat().length === 0) {
        toast({ 
          title: "Avertissement", 
          description: "Aucun ajustement partenaire valide trouvé.", 
          variant: "default" 
        });
      }
      
      if (missingPlanWarningsCount > 0) {
        toast({ 
          title: "Avertissement", 
          description: `${missingPlanWarningsCount} liens Partenaire/Plan invalides ignorés.`, 
          variant: "default" 
        });
      }

      setDataLoaded(true);
    } catch (err) {
      console.error("AppDataContext: Erreur critique pendant le chargement/traitement des données:", err);
      setError(err as Error);
      toast({
        title: "Erreur critique de chargement",
        description: `Impossible de charger les données nécessaires : ${(err as Error).message}. Vérifiez la console.`,
        variant: "destructive",
        duration: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadAppData();
  }, []);

  // Prepare context value
  const contextValue: AppDataContextType = {
    // Raw data
    partners,
    plans,
    categories,
    
    // Processed data structures
    allCategories: appDataState.allCategories,
    allPlans: appDataState.allPlans,
    allPartners: appDataState.allPartners,
    partnerToPlansMap: appDataState.partnerToPlansMap,
    planToCategoriesMap: appDataState.planToCategoriesMap,
    categoryToPlansMap: appDataState.categoryToPlansMap,
    baseRatesByDate: appDataState.baseRatesByDate,
    travcoBaseRatesByDate: appDataState.travcoBaseRatesByDate,
    categoryRulesMap: appDataState.categoryRulesMap,
    planRulesMap: appDataState.planRulesMap,
    partnerAdjustmentsMap: appDataState.partnerAdjustmentsMap,
    
    // ID/Name/Code mappings
    partnerNameToId: appDataState.partnerNameToId,
    categoryNameToId: appDataState.categoryNameToId,
    planCodeToId: appDataState.planCodeToId,
    partnerIdToName: appDataState.partnerIdToName,
    categoryIdToName: appDataState.categoryIdToName,
    planIdToCode: appDataState.planIdToCode,

    // Status
    loading,
    error,
    dataLoaded,

    // Helper functions
    getPartnerPlans,
    getPlanCategories,
    getPartnerAdjustments
  };

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};

/**
 * Custom hook to use the AppData context
 */
export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error("useAppData doit être utilisé à l'intérieur d'un AppDataProvider");
  }
  return context;
};
