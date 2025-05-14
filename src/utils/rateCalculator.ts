
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { FormValues, DailyRateDetail, CalculationResult, PlanRule, CategoryRule } from "@/types/calculateRate.types";

export async function calculateRate({
  values,
  planRules,
  categoryRules,
  partnerAdjustments,
  fetchDailyBaseRate,
  partners,
  plans,
  categories
}: {
  values: FormValues;
  planRules: PlanRule | null;
  categoryRules: CategoryRule | null;
  partnerAdjustments: any[];
  fetchDailyBaseRate: (date: Date, baseSource: string) => Promise<number>;
  partners: any[];
  plans: any[];
  categories: any[];
}): Promise<CalculationResult | null> {
  try {
    // Verify required rules
    if (!planRules) {
      throw new Error("Les règles du plan sont manquantes");
    }

    if (!categoryRules) {
      throw new Error("Les règles de catégorie sont manquantes");
    }

    // Arrays to store daily results
    const dailyBreakdown: DailyRateDetail[] = [];
    let subtotal = 0;

    // Calculate rate for each day of the stay
    for (let i = 0; i < values.nights; i++) {
      // Current date
      const currentDate = new Date(values.arrivalDate);
      currentDate.setDate(currentDate.getDate() + i);

      // Get base rate for this day
      const baseRate = await fetchDailyBaseRate(currentDate, planRules.base_source);
      
      // Apply category rules
      let calculatedRate = baseRate;
      if (categoryRules) {
        if (categoryRules.formula_type === 'multiplier') {
          calculatedRate = baseRate * categoryRules.formula_multiplier;
        }

        // Apply offset
        calculatedRate += categoryRules.formula_offset;
      }

      // Apply plan rules (steps)
      if (planRules && planRules.steps) {
        // Convert Json to array safely
        const stepsArray = Array.isArray(planRules.steps) 
          ? planRules.steps 
          : typeof planRules.steps === 'string' 
            ? JSON.parse(planRules.steps) 
            : [];

        // Process each step
        for (const step of stepsArray) {
          if (step && typeof step === 'object') {
            if (step.type === 'multiplier' && step.value) {
              calculatedRate = calculatedRate * parseFloat(step.value);
            } else if (step.type === 'add_offset' && step.value) {
              calculatedRate = calculatedRate + parseFloat(step.value);
            } else if (step.type === 'subtract_offset' && step.value) {
              calculatedRate = calculatedRate - parseFloat(step.value);
            }
          }
        }
      }

      // Round rate to 2 decimals
      calculatedRate = Math.round(calculatedRate * 100) / 100;

      // Add to daily breakdown
      dailyBreakdown.push({
        date: new Date(currentDate),
        baseRate,
        baseSource: planRules.base_source,
        calculatedRate
      });

      // Add to subtotal
      subtotal += calculatedRate;
    }

    // Apply partner adjustments
    let adjustedRate = subtotal;
    let adjustmentsAmount = 0;
    
    const selectedAdjustments = values.adjustments || [];
    
    for (const adjustmentId of selectedAdjustments) {
      const adjustment = partnerAdjustments.find(adj => adj.id === adjustmentId);
      
      if (adjustment) {
        if (adjustment.adjustment_type === 'percentage_commission') {
          const commission = adjustedRate * (parseFloat(adjustment.adjustment_value) / 100);
          adjustedRate -= commission;
          adjustmentsAmount -= commission;
        } else if (adjustment.adjustment_type === 'fixed_reduction') {
          const reduction = parseFloat(adjustment.adjustment_value);
          adjustedRate -= reduction;
          adjustmentsAmount -= reduction;
        } else if (adjustment.adjustment_type === 'fixed_fee') {
          const fee = parseFloat(adjustment.adjustment_value);
          adjustedRate += fee;
          adjustmentsAmount += fee;
        }
      }
    }

    // Apply global discount
    const discountAmount = adjustedRate * (values.discount / 100);
    const finalRate = adjustedRate - discountAmount;

    // Find names of selected entities
    const partnerName = partners.find(p => p.id === values.partnerId)?.name || '';
    const planName = plans.find(p => p.id === values.planId)?.code || '';
    const categoryName = categories.find(c => c.id === values.categoryId)?.name || '';
    
    // Departure date (arrival + nights)
    const departureDate = new Date(values.arrivalDate);
    departureDate.setDate(departureDate.getDate() + values.nights);

    // Return calculation result
    return {
      finalRate,
      subtotal,
      adjustmentsAmount,
      discountAmount,
      adjustedRate,
      dailyBreakdown,
      arrivalDate: values.arrivalDate,
      departureDate,
      nights: values.nights,
      partnerId: values.partnerId,
      planId: values.planId,
      categoryId: values.categoryId,
      discount: values.discount,
      partnerName,
      planName,
      categoryName
    };
  } catch (error) {
    console.error("Erreur lors du calcul du tarif:", error);
    throw error;
  }
}
