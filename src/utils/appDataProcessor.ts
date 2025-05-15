
import { 
  Category, 
  Plan, 
  Partner, 
  PartnerPlan, 
  DailyBaseRate, 
  CategoryRule, 
  PlanRule, 
  PartnerAdjustment 
} from "@/types/appData.types";

type FetchedData = {
  dailyRates: DailyBaseRate[] | null;
  partners: Partner[] | null;
  categories: Category[] | null;
  plans: Plan[] | null;
  partnerPlans: PartnerPlan[] | null;
  categoryRules: CategoryRule[] | null;
  planRules: PlanRule[] | null;
  partnerAdjustments: PartnerAdjustment[] | null;
};

type ProcessedData = {
  newState: {
    allCategories: Set<string>;
    allPlans: Set<string>;
    allPartners: Set<string>;
    partnerToPlansMap: Map<string, Set<string>>;
    planToCategoriesMap: Map<string, Set<string>>;
    categoryToPlansMap: Map<string, Set<string>>;
    baseRatesByDate: Map<string, number>;
    travcoBaseRatesByDate: Map<string, number>;
    categoryRulesMap: Map<string, CategoryRule>;
    planRulesMap: Map<string, PlanRule>;
    partnerAdjustmentsMap: Map<string, PartnerAdjustment[]>;
    partnerNameToId: Map<string, string>;
    categoryNameToId: Map<string, string>;
    planCodeToId: Map<string, string>;
    partnerIdToName: Map<string, string>;
    categoryIdToName: Map<string, string>;
    planIdToCode: Map<string, string>;
  };
  missingPlanWarningsCount: number;
};

/**
 * Process fetched data and create optimized data structures for the application
 */
export function processFetchedData(fetchedData: FetchedData): ProcessedData {
  console.log("AppDataContext: Début du traitement des données fetchées...");

  const newState = {
    allCategories: new Set<string>(),
    allPlans: new Set<string>(),
    allPartners: new Set<string>(),
    partnerToPlansMap: new Map<string, Set<string>>(),
    planToCategoriesMap: new Map<string, Set<string>>(),
    categoryToPlansMap: new Map<string, Set<string>>(),
    baseRatesByDate: new Map<string, number>(),
    travcoBaseRatesByDate: new Map<string, number>(),
    categoryRulesMap: new Map<string, CategoryRule>(),
    planRulesMap: new Map<string, PlanRule>(),
    partnerAdjustmentsMap: new Map<string, PartnerAdjustment[]>(),
    partnerNameToId: new Map<string, string>(),
    categoryNameToId: new Map<string, string>(),
    planCodeToId: new Map<string, string>(),
    partnerIdToName: new Map<string, string>(),
    categoryIdToName: new Map<string, string>(),
    planIdToCode: new Map<string, string>(),
  };

  const { dailyRates, partners, categories, plans, partnerPlans, categoryRules, planRules, partnerAdjustments } = fetchedData;

  // 1. Process Daily Base Rates
  dailyRates?.forEach(entry => {
    if (entry.date) {
      if (typeof entry.ota_rate === 'number' && !isNaN(entry.ota_rate) && entry.ota_rate >= 0) {
        newState.baseRatesByDate.set(entry.date, entry.ota_rate);
      } else if (entry.ota_rate !== null) { 
        console.warn(`AppDataContext: processFetchedData: skipping invalid ota_rate value (${entry.ota_rate}) for date ${entry.date}.`); 
      }

      if (typeof entry.travco_rate === 'number' && !isNaN(entry.travco_rate) && entry.travco_rate >= 0) {
        newState.travcoBaseRatesByDate.set(entry.date, entry.travco_rate);
      } else if (entry.travco_rate !== null) { 
        console.warn(`AppDataContext: processFetchedData: skipping invalid travco_rate value (${entry.travco_rate}) for date ${entry.date}.`); 
      }
    } else { 
      console.warn("AppDataContext: processFetchedData: skipping daily_base_rate entry with invalid date:", entry); 
    }
  });

  // 2. Process Partners, Categories, Plans and build ID/Name/Code maps
  partners?.forEach(p => {
    if (p.id && p.name) {
      newState.allPartners.add(p.name);
      newState.partnerIdToName.set(p.id, p.name);
      newState.partnerNameToId.set(p.name, p.id);
    } else { 
      console.warn("AppDataContext: processFetchedData: skipping invalid partner entry:", p); 
    }
  });

  categories?.forEach(c => {
    if (c.id && c.name) {
      newState.allCategories.add(c.name);
      newState.categoryIdToName.set(c.id, c.name);
      newState.categoryNameToId.set(c.name, c.id);
    } else { 
      console.warn("AppDataContext: processFetchedData: skipping invalid category entry:", c); 
    }
  });

  plans?.forEach(p => {
    if (p.id && p.code) {
      newState.allPlans.add(p.code);
      newState.planIdToCode.set(p.id, p.code);
      newState.planCodeToId.set(p.code, p.id);
    } else { 
      console.warn("AppDataContext: processFetchedData: skipping invalid plan entry:", p); 
    }
  });

  // 3. Process Partner-Plan associations (for UI filtering)
  let missingPlanWarningsCount = 0;
  partnerPlans?.forEach(pp => {
    if (pp.partner_id && pp.plan_id) {
      const partnerName = newState.partnerIdToName.get(pp.partner_id);
      const planCode = newState.planIdToCode.get(pp.plan_id);

      if (partnerName && planCode) {
        if (!newState.partnerToPlansMap.has(partnerName)) {
          newState.partnerToPlansMap.set(partnerName, new Set());
        }
        newState.partnerToPlansMap.get(partnerName)?.add(planCode);
      } else {
        console.warn(`AppDataContext: processFetchedData: skipping partner_plan entry with invalid IDs (partner_id: ${pp.partner_id}, plan_id: ${pp.plan_id}). Partner name or plan code not found based on IDs.`);
        missingPlanWarningsCount++;
      }
    } else { 
      console.warn("AppDataContext: processFetchedData: skipping invalid partner_plan entry:", pp); 
    }
  });

  // 4. Populate Category-Plan and Plan-Category maps
  console.warn("AppDataContext: Populate Category-Plan / Plan-Category maps: Using temporary cross-product of all fetched categories and plans for dropdown purposes. This may show invalid combinations.");
  const allCategoryIds = [...newState.categoryIdToName.keys()];
  const allPlanIds = [...newState.planIdToCode.keys()];

  allCategoryIds.forEach(catId => {
    const catName = newState.categoryIdToName.get(catId);
    if(catName) newState.categoryToPlansMap.set(catName, new Set([...newState.planIdToCode.values()]));
  });
  
  allPlanIds.forEach(planId => {
    const planCode = newState.planIdToCode.get(planId);
    if(planCode) newState.planToCategoriesMap.set(planCode, new Set([...newState.categoryIdToName.values()]));
  });

  // 5. Process Rules and Adjustments
  // Category Rules (Map category_id -> rule object)
  categoryRules?.forEach(rule => {
    if (rule.category_id) {
      if (typeof rule.base_source === 'string' && typeof rule.formula_type === 'string' &&
          typeof rule.formula_multiplier === 'number' && typeof rule.formula_offset === 'number') {
        newState.categoryRulesMap.set(rule.category_id, rule);
      } else {
        console.warn("AppDataContext: processFetchedData: skipping invalid category_rules entry (invalid rule fields):", rule);
      }
    } else { 
      console.warn("AppDataContext: processFetchedData: skipping invalid category_rules entry (missing category_id):", rule); 
    }
  });

  // Plan Rules (Map plan_id -> rule object)
  planRules?.forEach(rule => {
    if (rule.plan_id) {
      if (typeof rule.base_source === 'string' && (rule.steps === null || (typeof rule.steps === 'object' && rule.steps !== null && Array.isArray(rule.steps.steps)))) {
        newState.planRulesMap.set(rule.plan_id, rule);
      } else {
        console.warn("AppDataContext: processFetchedData: skipping invalid plan_rules entry (invalid rule fields):", rule);
      }
    } else { 
      console.warn("AppDataContext: processFetchedData: skipping invalid plan_rules entry (missing plan_id):", rule); 
    }
  });

  // Partner Adjustments (Map partner_id -> array of adjustment objects)
  partnerAdjustments?.forEach(adj => {
    if (adj.partner_id) {
      if (typeof adj.adjustment_type === 'string' && typeof adj.default_checked === 'boolean' &&
          typeof adj.description === 'string' && typeof adj.ui_control === 'string' && typeof adj.associated_plan_filter === 'string') {
        if (!newState.partnerAdjustmentsMap.has(adj.partner_id)) {
          newState.partnerAdjustmentsMap.set(adj.partner_id, []);
        }
        newState.partnerAdjustmentsMap.get(adj.partner_id)?.push(adj);
      } else {
        console.warn("AppDataContext: processFetchedData: skipping invalid partner_adjustments entry (invalid adjustment fields):", adj);
      }
    } else { 
      console.warn("AppDataContext: processFetchedData: skipping invalid partner_adjustments entry (missing partner_id):", adj); 
    }
  });

  console.log("AppDataContext: Traitement des données fetchées terminé.");
  return { newState, missingPlanWarningsCount };
}
