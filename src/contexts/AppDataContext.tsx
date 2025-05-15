
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDateYYYYMMDD } from '@/lib/utils';


// ==========================================================================
// ==                            TYPES DE DONNÉES                          ==
// ==========================================================================
// Définition des types de données pour TypeScript (si tu l'utilises)

type Category = { id: string; name: string; };
type Plan = { id: string; code: string; description: string | null; };
type Partner = { id: string; name: string; };
type PartnerPlan = { partner_id: string; plan_id: string; };
type DailyBaseRate = { date: string; ota_rate: number | null; travco_rate: number | null; };
type CategoryRule = { id: string; category_id: string; base_source: string; formula_type: string; formula_multiplier: number; formula_offset: number; }; // Schéma DB réel
type PlanRule = { id: string; plan_id: string; base_source: string; steps: any; }; // Schéma DB réel (steps est JSONB, type any pour simplifier ici)
type PartnerAdjustment = { id: string; partner_id: string; description: string; ui_control: string; adjustment_type: string; adjustment_value: string | null; default_checked: boolean; associated_plan_filter: string | null; }; // Schéma DB réel


// ==========================================================================
// ==                          INTERFACE DU CONTEXTE                       ==
// ==========================================================================
// Définition de l'interface pour le contexte exposé aux composants

interface AppDataContextType {
  // Données brutes (stockées dans l'état) - Potentiellement moins utilisées directement
  partners: Partner[];
  plans: Plan[];
  categories: Category[];
  // partnerPlans: PartnerPlan[];
  // dailyBaseRates: DailyBaseRate[]; // Exemple si tu veux stocker les brutes aussi
  // categoryRules: CategoryRule[];
  // planRules: PlanRule[];
  // partnerAdjustments: PartnerAdjustment[];

  // Données traitées (stockées dans l'état, optimisées pour l'accès)
  allCategories: Set<string>; // Noms de catégories pour dropdowns
  allPlans: Set<string>; // Codes de plans pour dropdowns
  allPartners: Set<string>; // Noms de partenaires pour dropdowns

  partnerToPlansMap: Map<string, Set<string>>; // Map PartnerName -> Set<PlanCode> (pour filtrage UI)
  planToCategoriesMap: Map<string, Set<string>>; // Map PlanCode -> Set<CategoryName> (pour filtrage UI)
  categoryToPlansMap: Map<string, Set<string>>; // Map CategoryName -> Set<PlanCode> (pour filtrage UI)

  baseRatesByDate: Map<string, number>; // Map Date (YYYY-MM-DD) -> OTA Rate
  travcoBaseRatesByDate: Map<string, number>; // Map Date (YYYY-MM-DD) -> Travco Rate

  categoryRulesMap: Map<string, CategoryRule>; // Map category_id -> Rule Object
  planRulesMap: Map<string, PlanRule>; // Map plan_id -> Rule Object
  partnerAdjustmentsMap: Map<string, PartnerAdjustment[]>; // Map partner_id -> Array of Adjustment Objects

  // Maps pour lookups Nom/Code <-> ID
  partnerNameToId: Map<string, string>; // Map PartnerName -> partner_id
  categoryNameToId: Map<string, string>; // Map CategoryName -> category_id
  planCodeToId: Map<string, string>; // Map PlanCode -> plan_id
  partnerIdToName: Map<string, string>; // Map partner_id -> PartnerName
  categoryIdToName: Map<string, string>; // Map category_id -> CategoryName
  planIdToCode: Map<string, string>; // Map plan_id -> PlanCode


  // État du chargement
  loading: boolean;
  error: Error | null; // Stocke l'erreur si le chargement échoue
  dataLoaded: boolean; // Flag indiquant si le chargement initial est terminé et réussi

  // Add missing functions to the type
  getPartnerPlans: (partnerId: string) => string[];
  getPlanCategories: (planId: string) => string[];
  getPartnerAdjustments: (partnerId: string, planId?: string) => PartnerAdjustment[];
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);


// ==========================================================================
// ==                            PROVIDER DU CONTEXTE                      ==
// ==========================================================================

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // État pour stocker les données TRAITÉES (Maps et Sets)
  const [appDataState, setAppDataState] = useState<{
    allCategories: Set<string>; allPlans: Set<string>; allPartners: Set<string>;
    partnerToPlansMap: Map<string, Set<string>>; planToCategoriesMap: Map<string, Set<string>>; categoryToPlansMap: Map<string, Set<string>>;
    baseRatesByDate: Map<string, number>; travcoBaseRatesByDate: Map<string, number>;
    categoryRulesMap: Map<string, CategoryRule>; planRulesMap: Map<string, PlanRule>; partnerAdjustmentsMap: Map<string, PartnerAdjustment[]>;
    partnerNameToId: Map<string, string>; categoryNameToId: Map<string, string>; planCodeToId: Map<string, string>;
    partnerIdToName: Map<string, string>; categoryIdToName: Map<string, string>; planIdToCode: Map<string, string>;
  }>({
    allCategories: new Set(), allPlans: new Set(), allPartners: new Set(),
    partnerToPlansMap: new Map(), planToCategoriesMap: new Map(), categoryToPlansMap: new Map(),
    baseRatesByDate: new Map(), travcoBaseRatesByDate: new Map(),
    categoryRulesMap: new Map(), planRulesMap: new Map(), partnerAdjustmentsMap: new Map(),
    partnerNameToId: new Map(), categoryNameToId: new Map(), planCodeToId: new Map(),
    partnerIdToName: new Map(), categoryIdToName: new Map(), planIdToCode: new Map(),
  });
  
  // Add missing state variables for raw data
  const [partners, setPartners] = useState<Partner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false); // Flag pour le succès du chargement initial

  const { toast } = useToast(); // Assumes you have a ToastProvider setup


  // ==========================================================================
  // ==                     FONCTIONS DE FETCH SUPABASE                      ==
  // ==========================================================================
  // Ces fonctions sont similaires à celles de l'ancien api.js, mais retournent directement le data ou null


  async function fetchDailyBaseRates() {
      console.log("AppDataContext: Fetching daily_base_rates...");
      const { data, error } = await supabase.from('daily_base_rates').select('date, ota_rate, travco_rate');
      if (error) { console.error("AppDataContext: Error fetching daily_base_rates:", error); return null; }
      console.log(`AppDataContext: Fetched ${data?.length || 0} daily_base_rates entries.`);
      return data as DailyBaseRate[];
  }

  async function fetchPartners() {
      console.log("AppDataContext: Fetching partners...");
      const { data, error } = await supabase.from('partners').select('id, name');
      if (error) { console.error("AppDataContext: Error fetching partners:", error); return null; }
      console.log(`AppDataContext: Fetched ${data?.length || 0} partners.`);
      return data as Partner[];
  }

  async function fetchCategories() {
      console.log("AppDataContext: Fetching categories...");
      const { data, error } = await supabase.from('categories').select('id, name');
      if (error) { console.error("AppDataContext: Error fetching categories:", error); return null; }
      console.log(`AppDataContext: Fetched ${data?.length || 0} categories.`);
      return data as Category[];
  }

  async function fetchPlans() {
      console.log("AppDataContext: Fetching plans...");
      const { data, error } = await supabase.from('plans').select('id, code, description');
      if (error) { console.error("AppDataContext: Error fetching plans:", error); return null; }
      console.log(`AppDataContext: Fetched ${data?.length || 0} plans.`);
      return data as Plan[];
  }

  async function fetchPartnerPlans() {
      console.log("AppDataContext: Fetching partner_plans...");
      const { data, error } = await supabase.from('partner_plans').select('partner_id, plan_id');
      if (error) { console.error("AppDataContext: Error fetching partner_plans:", error); return null; }
      console.log(`AppDataContext: Fetched ${data?.length || 0} partner_plans entries.`);
      return data as PartnerPlan[];
  }

  async function fetchCategoryRules() {
      console.log("AppDataContext: Fetching category_rules...");
      const { data, error } = await supabase.from('category_rules').select('id, category_id, base_source, formula_type, formula_multiplier, formula_offset');
      if (error) { console.error("AppDataContext: Error fetching category_rules:", error); return null; }
      console.log(`AppDataContext: Fetched ${data?.length || 0} category_rules entries.`);
      return data as CategoryRule[];
  }

  async function fetchPlanRules() {
      console.log("AppDataContext: Fetching plan_rules...");
      const { data, error } = await supabase.from('plan_rules').select('id, plan_id, base_source, steps');
      if (error) { console.error("AppDataContext: Error fetching plan_rules:", error); return null; }
      console.log(`AppDataContext: Fetched ${data?.length || 0} plan_rules entries.`);
      return data as PlanRule[];
  }

  async function fetchPartnerAdjustments() {
      console.log("AppDataContext: Fetching partner_adjustments...");
      const { data, error } = await supabase.from('partner_adjustments').select('id, partner_id, description, ui_control, adjustment_type, adjustment_value, default_checked, associated_plan_filter');
      if (error) { console.error("AppDataContext: Error fetching partner_adjustments:", error); return null; }
      console.log(`AppDataContext: Fetched ${data?.length || 0} partner_adjustments entries.`);
      return data as PartnerAdjustment[];
  }


  // ==========================================================================
  // ==                          TRAITEMENT DES DONNÉES                      ==
  // ==========================================================================
  // Cette logique est similaire à processFetchedData de l'ancien api.js

  function processFetchedData(fetchedData: {
    dailyRates: DailyBaseRate[] | null;
    partners: Partner[] | null;
    categories: Category[] | null;
    plans: Plan[] | null;
    partnerPlans: PartnerPlan[] | null;
    categoryRules: CategoryRule[] | null;
    planRules: PlanRule[] | null;
    partnerAdjustments: PartnerAdjustment[] | null;
  }) {
    console.log("AppDataContext: Début du traitement des données fetchées...");

    const newState = {
      allCategories: new Set<string>(), allPlans: new Set<string>(), allPartners: new Set<string>(),
      partnerToPlansMap: new Map<string, Set<string>>(), planToCategoriesMap: new Map<string, Set<string>>(), categoryToPlansMap: new Map<string, Set<string>>(),
      baseRatesByDate: new Map<string, number>(), travcoBaseRatesByDate: new Map<string, number>(),
      categoryRulesMap: new Map<string, CategoryRule>(), planRulesMap: new Map<string, PlanRule>(), partnerAdjustmentsMap: new Map<string, PartnerAdjustment[]>(),
      partnerNameToId: new Map<string, string>(), categoryNameToId: new Map<string, string>(), planCodeToId: new Map<string, string>(),
      partnerIdToName: new Map<string, string>(), categoryIdToName: new Map<string, string>(), planIdToCode: new Map<string, string>(),
    };

    const { dailyRates, partners, categories, plans, partnerPlans, categoryRules, planRules, partnerAdjustments } = fetchedData;

    // 1. Process Daily Base Rates
    dailyRates?.forEach(entry => {
        if (entry.date) {
            if (typeof entry.ota_rate === 'number' && !isNaN(entry.ota_rate) && entry.ota_rate >= 0) {
                 newState.baseRatesByDate.set(entry.date, entry.ota_rate);
            } else if (entry.ota_rate !== null) { console.warn(`AppDataContext: processFetchedData: skipping invalid ota_rate value (${entry.ota_rate}) for date ${entry.date}.`); }

            if (typeof entry.travco_rate === 'number' && !isNaN(entry.travco_rate) && entry.travco_rate >= 0) {
                 newState.travcoBaseRatesByDate.set(entry.date, entry.travco_rate);
            } else if (entry.travco_rate !== null) { console.warn(`AppDataContext: processFetchedData: skipping invalid travco_rate value (${entry.travco_rate}) for date ${entry.date}.`); }
        } else { console.warn("AppDataContext: processFetchedData: skipping daily_base_rate entry with invalid date:", entry); }
    });


    // 2. Process Partners, Categories, Plans and build ID/Name/Code maps
    partners?.forEach(p => {
         if (p.id && p.name) {
              newState.allPartners.add(p.name);
              newState.partnerIdToName.set(p.id, p.name);
              newState.partnerNameToId.set(p.name, p.id);
         } else { console.warn("AppDataContext: processFetchedData: skipping invalid partner entry:", p); }
    });

    categories?.forEach(c => {
         if (c.id && c.name) {
              newState.allCategories.add(c.name);
              newState.categoryIdToName.set(c.id, c.name);
              newState.categoryNameToId.set(c.name, c.id);
         } else { console.warn("AppDataContext: processFetchedData: skipping invalid category entry:", c); }
    });

    plans?.forEach(p => {
         if (p.id && p.code) {
              newState.allPlans.add(p.code);
              newState.planIdToCode.set(p.id, p.code);
              newState.planCodeToId.set(p.code, p.id);
              // ratePlanDescriptions[p.code] = p.description || `Description non disponible`; // Manage descriptions outside of Map if needed globally
         } else { console.warn("AppDataContext: processFetchedData: skipping invalid plan entry:", p); }
    });


    // 3. Process Partner-Plan associations (for UI filtering)
    let missingPlanWarningsCount = 0;
    partnerPlans?.forEach(pp => {
         if (pp.partner_id && pp.plan_id) {
              const partnerName = newState.partnerIdToName.get(pp.partner_id); // Lookup using ID map
              const planCode = newState.planIdToCode.get(pp.plan_id); // Lookup using ID map

              if (partnerName && planCode) {
                   if (!newState.partnerToPlansMap.has(partnerName)) {
                        newState.partnerToPlansMap.set(partnerName, new Set());
                   }
                   newState.partnerToPlansMap.get(partnerName)?.add(planCode);
              } else {
                   console.warn(`AppDataContext: processFetchedData: skipping partner_plan entry with invalid IDs (partner_id: ${pp.partner_id}, plan_id: ${pp.plan_id}). Partner name or plan code not found based on IDs.`);
                   missingPlanWarningsCount++;
              }
         } else { console.warn("AppDataContext: processFetchedData: skipping invalid partner_plan entry:", pp); }
    });


    // 4. Populate Category-Plan and Plan-Category maps (TEMPORAIRE / SIMPLIFIÉ pour les dropdowns)
    // Ceci crée un croisement complet de toutes les catégories et de tous les plans.
    // Si une table de liaison Plan-Catégorie existe en DB, la logique devrait l'utiliser à la place.
    console.warn("AppDataContext: Populate Category-Plan / Plan-Category maps: Using temporary cross-product of all fetched categories and plans for dropdown purposes. This may show invalid combinations.");
    const allCategoryIds = [...newState.categoryIdToName.keys()];
    const allPlanIds = [...newState.planIdToCode.keys()];

    allCategoryIds.forEach(catId => {
         const catName = newState.categoryIdToName.get(catId);
         if(catName) newState.categoryToPlansMap.set(catName, new Set([...newState.planIdToCode.values()])); // Map Name -> Set<PlanCode>
    });
    allPlanIds.forEach(planId => {
         const planCode = newState.planIdToCode.get(planId);
         if(planCode) newState.planToCategoriesMap.set(planCode, new Set([...newState.categoryIdToName.values()])); // Map Code -> Set<CategoryName>
    });


     // 5. Process Rules and Adjustments
     // Category Rules (Map category_id -> rule object)
     categoryRules?.forEach(rule => {
           if (rule.category_id) {
               // Vérifie les champs de la règle pour la cohérence avant de la stocker
               if (typeof rule.base_source === 'string' && typeof rule.formula_type === 'string' &&
                  typeof rule.formula_multiplier === 'number' && typeof rule.formula_offset === 'number') {
                    newState.categoryRulesMap.set(rule.category_id, rule); // Store the entire rule object
               } else {
                   console.warn("AppDataContext: processFetchedData: skipping invalid category_rules entry (invalid rule fields):", rule);
               }
          } else { console.warn("AppDataContext: processFetchedData: skipping invalid category_rules entry (missing category_id):", rule); }
     });


     // Plan Rules (Map plan_id -> rule object)
      planRules?.forEach(rule => {
            if (rule.plan_id) {
                // Vérifie les champs de la règle pour la cohérence avant de la stocker
                // 'steps' est JSONB, vérifie qu'il est un objet ou null, et si possible, qu'il a la structure attendue { steps: [] }
                if (typeof rule.base_source === 'string' && (rule.steps === null || (typeof rule.steps === 'object' && rule.steps !== null && Array.isArray(rule.steps.steps)))) {
                    newState.planRulesMap.set(rule.plan_id, rule); // Store the entire rule object
                } else {
                   console.warn("AppDataContext: processFetchedData: skipping invalid plan_rules entry (invalid rule fields):", rule);
                }
           } else { console.warn("AppDataContext: processFetchedData: skipping invalid plan_rules entry (missing plan_id):", rule); }
      });


      // Partner Adjustments (Map partner_id -> array of adjustment objects)
      partnerAdjustments?.forEach(adj => {
           if (adj.partner_id) {
                // Vérifie les champs de l'ajustement pour la cohérence
                if (typeof adj.adjustment_type === 'string' && typeof adj.default_checked === 'boolean' &&
                    typeof adj.description === 'string' && typeof adj.ui_control === 'string' && typeof adj.associated_plan_filter === 'string') { // Check for required fields
                     if (!newState.partnerAdjustmentsMap.has(adj.partner_id)) {
                          newState.partnerAdjustmentsMap.set(adj.partner_id, []);
                     }
                     newState.partnerAdjustmentsMap.get(adj.partner_id)?.push(adj); // Store the entire adjustment object
                } else {
                    console.warn("AppDataContext: processFetchedData: skipping invalid partner_adjustments entry (invalid adjustment fields):", adj);
                }
           } else { console.warn("AppDataContext: processFetchedData: skipping invalid partner_adjustments entry (missing partner_id):", adj); }
      });


    console.log("AppDataContext: Traitement des données fetchées terminé.");
    return { newState, missingPlanWarningsCount }; // Retourne le nouvel état traité et les stats
  }


  // ==========================================================================
  // ==                       FONCTION DE CHARGEMENT PRINCIPALE              ==
  // ==========================================================================
  // Cette fonction est similaire à loadAppData de l'ancien api.js

  const loadAppData = async () => {
    // Si le chargement initial est déjà réussi, on ne refait rien.
    if (dataLoaded) {
        console.log("AppDataContext: Données déjà chargées et traitées. Skipping fetch.");
        return; // Sortie prématurée
    }

    console.log("AppDataContext: Début du chargement initial des données depuis Supabase...");
    setError(null); // Réinitialise l'état d'erreur
    setLoading(true); // Indique que le chargement commence

    try {
      // Récupérer TOUTES les données nécessaires en parallèle
      const [
        { data: categoriesData, error: categoriesError },
        { data: plansData, error: plansError },
        { data: partnersData, error: partnersError },
        { data: partnerPlansData, error: partnerPlansError },
        { data: dailyRatesData, error: dailyRatesError }, // <-- AJOUT du fetch
        { data: categoryRulesData, error: categoryRulesError }, // <-- AJOUT du fetch
        { data: planRulesData, error: planRulesError }, // <-- AJOUT du fetch
        { data: partnerAdjustmentsData, error: partnerAdjustmentsError }
      ] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('plans').select('id, code, description'), // Sélection explicite des colonnes nécessaires
        supabase.from('partners').select('id, name'), // Sélection explicite des colonnes nécessaires
        supabase.from('partner_plans').select('partner_id, plan_id'), // Sélection explicite des colonnes nécessaires
        supabase.from('daily_base_rates').select('date, ota_rate, travco_rate'), // Sélection explicite des colonnes
        supabase.from('category_rules').select('id, category_id, base_source, formula_type, formula_multiplier, formula_offset'), // Sélection explicite des colonnes
        supabase.from('plan_rules').select('id, plan_id, base_source, steps'), // Sélection explicite des colonnes
        supabase.from('partner_adjustments').select('id, partner_id, description, ui_control, adjustment_type, adjustment_value, default_checked, associated_plan_filter') // Sélection explicite des colonnes
      ]);

      // Vérifier les erreurs de fetch
      if (categoriesError) throw categoriesError;
      if (plansError) throw plansError;
      if (partnersError) throw partnersError;
      if (partnerPlansError) throw partnerPlansError;
      if (dailyRatesError) throw dailyRatesError; // Vérifie erreur pour dailyRates
      if (categoryRulesError) throw categoryRulesError; // Vérifie erreur pour rules
      if (planRulesError) throw planRulesError; // Vérifie erreur pour plan_rules
      if (partnerAdjustmentsError) throw partnerAdjustmentsError;


      // Compiler les données fetchées dans un seul objet
      const fetchedData = {
        categories: categoriesData as Category[],
        plans: plansData as Plan[],
        partners: partnersData as Partner[],
        partnerPlans: partnerPlansData as PartnerPlan[],
        dailyRates: dailyRatesData as DailyBaseRate[], // Inclure dans l'objet
        categoryRules: categoryRulesData as CategoryRule[], // Inclure dans l'objet
        planRules: planRulesData as PlanRule[], // Inclure dans l'objet
        partnerAdjustments: partnerAdjustmentsData as PartnerAdjustment[], // Inclure dans l'objet
      };

      // Vérifier si les données fetchées ne sont pas nulles (fetch successful but no data)
       if (!fetchedData.categories || !fetchedData.plans || !fetchedData.partners || !fetchedData.partnerPlans ||
           !fetchedData.dailyRates || !fetchedData.categoryRules || !fetchedData.planRules || !fetchedData.partnerAdjustments) {
           // Ceci peut arriver si le fetch réussit mais retourne { data: null, error: null } pour une raison inattendue
           throw new Error("Une ou plusieurs tables essentielles ont retourné des données nulles.");
       }

      // Update state for raw data
      setCategories(fetchedData.categories);
      setPlans(fetchedData.plans);
      setPartners(fetchedData.partners);

      // Traiter les données pour peupler l'état du contexte (Maps/Sets)
      const { newState, missingPlanWarningsCount } = processFetchedData(fetchedData);

      // Mettre à jour l'état du contexte
      setAppDataState(newState);

      // Afficher des avertissements UI basés sur le traitement si nécessaire
      if (newState.baseRatesByDate.size === 0 && newState.travcoBaseRatesByDate.size === 0) {
          toast({ title: "Avertissement", description: "Aucun tarif de base valide trouvé. Le calcul sera limité.", variant: "default" });
      }
      if (newState.categoryRulesMap.size === 0) {
          toast({ title: "Avertissement", description: "Aucune règle de catégorie trouvée. Les calculs par catégorie pourraient être incorrects.", variant: "default" });
      }
      if (newState.planRulesMap.size === 0) {
           toast({ title: "Avertissement", description: "Aucune règle de plan trouvée. Les calculs de plans pourraient être incorrects.", variant: "default" });
      }
      if ([...newState.partnerAdjustmentsMap.values()].flat().length === 0) {
           toast({ title: "Avertissement", description: "Aucun ajustement partenaire valide trouvé.", variant: "default" });
      }
      if (missingPlanWarningsCount > 0) {
           toast({ title: "Avertissement", description: `${missingPlanWarningsCount} liens Partenaire/Plan invalides ignorés.`, variant: "default" });
      }


      // Marquer le chargement comme réussi
      setDataLoaded(true);

    } catch (err) {
      console.error("AppDataContext: Erreur critique pendant le chargement/traitement des données:", err);
      setError(err as Error); // Stocke l'objet erreur
      // Afficher une toast d'erreur persistant
      toast({
        title: "Erreur critique de chargement",
        description: `Impossible de charger les données nécessaires : ${(err as Error).message}. Vérifiez la console.`,
        variant: "destructive",
        duration: 0, // Rendre persistant
      });
      // Ne pas marquer dataLoaded comme true si erreur
    } finally {
      setLoading(false); // Le chargement est terminé (succès ou échec)
    }
  };


  // Charger les données au montage du Provider
  useEffect(() => {
    loadAppData();
  }, []); // Dépendances vides pour exécuter une seule fois au montage


  // ==========================================================================
  // ==                             VALEUR DU CONTEXTE                       ==
  // ==========================================================================
  // Expose les données TRATÉES et l'état de chargement/erreur

  const contextValue: AppDataContextType = {
    // Include the raw data state variables
    partners,
    plans,
    categories,
    
    // Expose les Sets et Maps traités
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
    partnerNameToId: appDataState.partnerNameToId,
    categoryNameToId: appDataState.categoryNameToId,
    planCodeToId: appDataState.planCodeToId,
    partnerIdToName: appDataState.partnerIdToName,
    categoryIdToName: appDataState.categoryIdToName,
    planIdToCode: appDataState.planIdToCode,


    loading,
    error,
    dataLoaded, // Expose le flag de succès


    // Expose des fonctions helpers qui utilisent les Maps stockées (similaires aux anciens getters de api.js)
    // Les fonctions getter spécifiques (getPlanIdByCode etc.) ne sont plus nécessaires ici si les Maps sont exposées,
    // mais on peut les recréer si c'est plus propre pour les composants.
    // Pour l'instant, exposons les Maps directement.
    // Les fonctions getPartnerPlans, getPlanCategories, getPartnerAdjustments ci-dessous
    // doivent être réécrites pour utiliser les Maps stockées.

    // Ré-implémentation des fonctions helpers existantes pour utiliser l'état du contexte
    getPartnerPlans: (partnerId: string): string[] => {
      // Retourne les codes de plan associés à un partner_id donné
      // Nécessite de mapper l'ID partenaire au Nom, puis d'utiliser partnerToPlansMap (Nom -> Set<Code>)
      const partnerName = appDataState.partnerIdToName.get(partnerId);
      if (!partnerName) return [];
      const planCodes = appDataState.partnerToPlansMap.get(partnerName) || new Set();
      return Array.from(planCodes); // Retourne un tableau de codes de plan
    },

    getPlanCategories: (planId: string): string[] => {
       // Temporaire: retourne les noms de toutes les catégories (croisement complet)
       // Si tu as une table de liaison Plan-Catégorie, il faudrait l'utiliser ici.
       // La map planToCategoriesMap est peuplée temporairement avec le croisement complet.
       const planCode = appDataState.planIdToCode.get(planId);
       if(!planCode) return [];
       const categoryNames = appDataState.planToCategoriesMap.get(planCode) || new Set();
       return Array.from(categoryNames); // Retourne un tableau de noms de catégorie
    },

    getPartnerAdjustments: (partnerId: string, planId?: string): PartnerAdjustment[] => {
       // Retourne un tableau des ajustements associés à un partner_id donné.
       // Le filtrage par plan_id basé sur associated_plan_filter devrait se faire *après* avoir obtenu la liste pour le partenaire,
       // ou idéalement, la logique d'APPLICATION des ajustements (dans calcul.js) devrait gérer le filtre.
       // Cette fonction devrait probablement juste retourner TOUS les ajustements pour un partenaire donné.
       // Le filtrage UI ou le filtrage pour l'application se fait en aval.
       const adjustments = appDataState.partnerAdjustmentsMap.get(partnerId);
       if (!adjustments) return [];

       // Si planId est fourni, tu peux filtrer ici pour l'affichage UI par exemple
       if (planId) {
            const planCode = appDataState.planIdToCode.get(planId); // Get plan code from ID
            if (!planCode) {
                 console.warn("AppDataContext: getPartnerAdjustments: Plan ID not found for filtering.", planId);
                 return adjustments; // Return all adjustments if plan code not found for filtering
            }
             // Applique le filtre associé au plan
             return adjustments.filter(adj => {
                 if (!adj.associated_plan_filter) return true; // Si pas de filtre associé, l'ajustement s'applique potentiellement à tous les plans de ce partenaire
                 // Logique de correspondance du filtre (ex: "MOBILE-*" vs "MOBILE-BB-FLEX-1P")
                 // Ceci est une logique d'INTERPRÉTATION du filtre.
                 // Simplifié : vérifie si le code du plan commence par le filtre si le filtre finit par "*"
                 // ou si le code du plan est exactement égal au filtre.
                 const filterValue = adj.associated_plan_filter.trim();
                 if (filterValue.endsWith('*')) {
                      return planCode.startsWith(filterValue.slice(0, -1)); // Check if plan code starts with filter prefix
                 } else {
                      return planCode === filterValue; // Check for exact match
                 }
             });
       }

       return [...adjustments]; // Retourne une copie du tableau de tous les ajustements pour ce partenaire (sans filtrage plan)
    },
  };

  // ==========================================================================
  // ==                            EFFECT HOOK POUR LE CHARGEMENT            ==
  // ==========================================================================

  // Exécute le chargement des données une seule fois au montage du composant
  useEffect(() => {
    loadAppData();
  }, []); // Dépendances vides pour exécuter une seule fois


  // ==========================================================================
  // ==                             COMPOSANT PROVIDER                       ==
  // ==========================================================================

  // Fournit les données traitées, l'état de chargement et d'erreur via le contexte
  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};


// ==========================================================================
// ==                               HOOK useAppData                        ==
// ==========================================================================

// Hook personnalisé pour accéder aux données du contexte
export const useAppData = (): AppDataContextType => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error("useAppData doit être utilisé à l'intérieur d'un AppDataProvider");
  }
  return context;
};

// ==========================================================================
// ==                               FONCTIONS HELPERS PUBLIQUES            ==
// ==========================================================================
// Ces fonctions peuvent être utilisées par d'autres composants pour accéder facilement aux données via le hook
// Elles ne sont pas exportées DIRECTEMENT, mais accessibles via useAppData().

// Exemple d'utilisation dans un composant :
// import { useAppData } from '@/contexts/AppDataContext';
// const { allCategories, getPlanIdByCode } = useAppData();
// console.log(allCategories);
// const planId = getPlanIdByCode('OTA-RO-FLEX');

