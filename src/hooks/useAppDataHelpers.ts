
import { useState, useEffect } from 'react';
import { 
  Partner, 
  Plan, 
  Category, 
  PartnerAdjustment 
} from "@/types/appData.types";

/**
 * Custom hook providing helper functions for AppData context
 */
export function useAppDataHelpers(
  appDataState: {
    partnerToPlansMap: Map<string, Set<string>>;
    planToCategoriesMap: Map<string, Set<string>>;
    partnerIdToName: Map<string, string>;
    planIdToCode: Map<string, string>;
    partnerAdjustmentsMap: Map<string, PartnerAdjustment[]>;
  }
) {
  /**
   * Get plans associated with a partner
   */
  const getPartnerPlans = (partnerId: string): string[] => {
    const partnerName = appDataState.partnerIdToName.get(partnerId);
    if (!partnerName) return [];
    const planCodes = appDataState.partnerToPlansMap.get(partnerName) || new Set();
    return Array.from(planCodes);
  };

  /**
   * Get categories associated with a plan
   */
  const getPlanCategories = (planId: string): string[] => {
    const planCode = appDataState.planIdToCode.get(planId);
    if(!planCode) return [];
    const categoryNames = appDataState.planToCategoriesMap.get(planCode) || new Set();
    return Array.from(categoryNames);
  };

  /**
   * Get adjustments for a partner, optionally filtered by plan
   */
  const getPartnerAdjustments = (partnerId: string, planId?: string): PartnerAdjustment[] => {
    const adjustments = appDataState.partnerAdjustmentsMap.get(partnerId);
    if (!adjustments) return [];

    // Filter by plan if provided
    if (planId) {
      const planCode = appDataState.planIdToCode.get(planId);
      if (!planCode) {
        console.warn("AppDataContext: getPartnerAdjustments: Plan ID not found for filtering.", planId);
        return adjustments;
      }
      
      // Apply plan filter
      return adjustments.filter(adj => {
        if (!adj.associated_plan_filter) return true;
        
        const filterValue = adj.associated_plan_filter.trim();
        if (filterValue.endsWith('*')) {
          return planCode.startsWith(filterValue.slice(0, -1));
        } else {
          return planCode === filterValue;
        }
      });
    }

    return [...adjustments];
  };

  return {
    getPartnerPlans,
    getPlanCategories,
    getPartnerAdjustments
  };
}
