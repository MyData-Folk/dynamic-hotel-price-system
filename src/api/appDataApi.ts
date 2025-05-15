
import { supabase } from "@/integrations/supabase/client";
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

/**
 * Fetches daily base rates from the database
 */
export async function fetchDailyBaseRates(): Promise<DailyBaseRate[] | null> {
  console.log("AppDataContext: Fetching daily_base_rates...");
  const { data, error } = await supabase.from('daily_base_rates').select('date, ota_rate, travco_rate');
  if (error) { 
    console.error("AppDataContext: Error fetching daily_base_rates:", error); 
    return null; 
  }
  console.log(`AppDataContext: Fetched ${data?.length || 0} daily_base_rates entries.`);
  return data as DailyBaseRate[];
}

/**
 * Fetches partners from the database
 */
export async function fetchPartners(): Promise<Partner[] | null> {
  console.log("AppDataContext: Fetching partners...");
  const { data, error } = await supabase.from('partners').select('id, name');
  if (error) { 
    console.error("AppDataContext: Error fetching partners:", error); 
    return null; 
  }
  console.log(`AppDataContext: Fetched ${data?.length || 0} partners.`);
  return data as Partner[];
}

/**
 * Fetches categories from the database
 */
export async function fetchCategories(): Promise<Category[] | null> {
  console.log("AppDataContext: Fetching categories...");
  const { data, error } = await supabase.from('categories').select('id, name');
  if (error) { 
    console.error("AppDataContext: Error fetching categories:", error); 
    return null; 
  }
  console.log(`AppDataContext: Fetched ${data?.length || 0} categories.`);
  return data as Category[];
}

/**
 * Fetches plans from the database
 */
export async function fetchPlans(): Promise<Plan[] | null> {
  console.log("AppDataContext: Fetching plans...");
  const { data, error } = await supabase.from('plans').select('id, code, description');
  if (error) { 
    console.error("AppDataContext: Error fetching plans:", error); 
    return null; 
  }
  console.log(`AppDataContext: Fetched ${data?.length || 0} plans.`);
  return data as Plan[];
}

/**
 * Fetches partner plans associations from the database
 */
export async function fetchPartnerPlans(): Promise<PartnerPlan[] | null> {
  console.log("AppDataContext: Fetching partner_plans...");
  const { data, error } = await supabase.from('partner_plans').select('partner_id, plan_id');
  if (error) { 
    console.error("AppDataContext: Error fetching partner_plans:", error); 
    return null; 
  }
  console.log(`AppDataContext: Fetched ${data?.length || 0} partner_plans entries.`);
  return data as PartnerPlan[];
}

/**
 * Fetches category rules from the database
 */
export async function fetchCategoryRules(): Promise<CategoryRule[] | null> {
  console.log("AppDataContext: Fetching category_rules...");
  const { data, error } = await supabase.from('category_rules').select('id, category_id, base_source, formula_type, formula_multiplier, formula_offset');
  if (error) { 
    console.error("AppDataContext: Error fetching category_rules:", error); 
    return null; 
  }
  console.log(`AppDataContext: Fetched ${data?.length || 0} category_rules entries.`);
  return data as CategoryRule[];
}

/**
 * Fetches plan rules from the database
 */
export async function fetchPlanRules(): Promise<PlanRule[] | null> {
  console.log("AppDataContext: Fetching plan_rules...");
  const { data, error } = await supabase.from('plan_rules').select('id, plan_id, base_source, steps');
  if (error) { 
    console.error("AppDataContext: Error fetching plan_rules:", error); 
    return null; 
  }
  console.log(`AppDataContext: Fetched ${data?.length || 0} plan_rules entries.`);
  return data as PlanRule[];
}

/**
 * Fetches partner adjustments from the database
 */
export async function fetchPartnerAdjustments(): Promise<PartnerAdjustment[] | null> {
  console.log("AppDataContext: Fetching partner_adjustments...");
  const { data, error } = await supabase.from('partner_adjustments').select('id, partner_id, description, ui_control, adjustment_type, adjustment_value, default_checked, associated_plan_filter');
  if (error) { 
    console.error("AppDataContext: Error fetching partner_adjustments:", error); 
    return null; 
  }
  console.log(`AppDataContext: Fetched ${data?.length || 0} partner_adjustments entries.`);
  return data as PartnerAdjustment[];
}

/**
 * Fetches all app data in parallel
 */
export async function fetchAllAppData() {
  try {
    const [
      { data: categoriesData, error: categoriesError },
      { data: plansData, error: plansError },
      { data: partnersData, error: partnersError },
      { data: partnerPlansData, error: partnerPlansError },
      { data: dailyRatesData, error: dailyRatesError },
      { data: categoryRulesData, error: categoryRulesError },
      { data: planRulesData, error: planRulesError },
      { data: partnerAdjustmentsData, error: partnerAdjustmentsError }
    ] = await Promise.all([
      supabase.from('categories').select('*'),
      supabase.from('plans').select('id, code, description'),
      supabase.from('partners').select('id, name'),
      supabase.from('partner_plans').select('partner_id, plan_id'),
      supabase.from('daily_base_rates').select('date, ota_rate, travco_rate'),
      supabase.from('category_rules').select('id, category_id, base_source, formula_type, formula_multiplier, formula_offset'),
      supabase.from('plan_rules').select('id, plan_id, base_source, steps'),
      supabase.from('partner_adjustments').select('id, partner_id, description, ui_control, adjustment_type, adjustment_value, default_checked, associated_plan_filter')
    ]);

    // Check for errors
    if (categoriesError) throw categoriesError;
    if (plansError) throw plansError;
    if (partnersError) throw partnersError;
    if (partnerPlansError) throw partnerPlansError;
    if (dailyRatesError) throw dailyRatesError;
    if (categoryRulesError) throw categoryRulesError;
    if (planRulesError) throw planRulesError;
    if (partnerAdjustmentsError) throw partnerAdjustmentsError;

    // Compile fetched data
    const fetchedData = {
      categories: categoriesData as Category[],
      plans: plansData as Plan[],
      partners: partnersData as Partner[],
      partnerPlans: partnerPlansData as PartnerPlan[],
      dailyRates: dailyRatesData as DailyBaseRate[],
      categoryRules: categoryRulesData as CategoryRule[],
      planRules: planRulesData as PlanRule[],
      partnerAdjustments: partnerAdjustmentsData as PartnerAdjustment[],
    };

    // Check for null data
    if (!fetchedData.categories || !fetchedData.plans || !fetchedData.partners || !fetchedData.partnerPlans ||
        !fetchedData.dailyRates || !fetchedData.categoryRules || !fetchedData.planRules || !fetchedData.partnerAdjustments) {
      throw new Error("Une ou plusieurs tables essentielles ont retourné des données nulles.");
    }

    return fetchedData;
  } catch (error) {
    throw error;
  }
}
