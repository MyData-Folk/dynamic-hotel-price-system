
// Type definitions for the AppData context

export type Category = { id: string; name: string; };
export type Plan = { id: string; code: string; description: string | null; };
export type Partner = { id: string; name: string; };
export type PartnerPlan = { partner_id: string; plan_id: string; };
export type DailyBaseRate = { date: string; ota_rate: number | null; travco_rate: number | null; };
export type CategoryRule = { 
  id: string; 
  category_id: string; 
  base_source: string; 
  formula_type: string; 
  formula_multiplier: number; 
  formula_offset: number; 
};
export type PlanRule = { 
  id: string; 
  plan_id: string; 
  base_source: string; 
  steps: any; 
};
export type PartnerAdjustment = { 
  id: string; 
  partner_id: string; 
  description: string; 
  ui_control: string; 
  adjustment_type: string; 
  adjustment_value: string | null; 
  default_checked: boolean; 
  associated_plan_filter: string | null; 
};

// Interface for the AppData context
export interface AppDataContextType {
  // Raw data
  partners: Partner[];
  plans: Plan[];
  categories: Category[];
  
  // Processed data structures
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
  
  // ID, name, and code mapping helpers
  partnerNameToId: Map<string, string>;
  categoryNameToId: Map<string, string>;
  planCodeToId: Map<string, string>;
  partnerIdToName: Map<string, string>;
  categoryIdToName: Map<string, string>;
  planIdToCode: Map<string, string>;

  // Loading state
  loading: boolean;
  error: Error | null;
  dataLoaded: boolean;

  // Helper functions
  getPartnerPlans: (partnerId: string) => string[];
  getPlanCategories: (planId: string) => string[];
  getPartnerAdjustments: (partnerId: string, planId?: string) => PartnerAdjustment[];
}
