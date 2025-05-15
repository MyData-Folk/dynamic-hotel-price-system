
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

      // Get base rate for this day from the specified source (either 'ota_rate' or 'travco_rate')
      const baseRate = await fetchDailyBaseRate(currentDate, planRules.base_source);
      
      // Apply category rules
      let calculatedRate = baseRate;
      if (categoryRules) {
        // Apply category multiplier if specified
        if (categoryRules.formula_type === 'multiplier') {
          calculatedRate = baseRate * categoryRules.formula_multiplier;
        }

        // Apply category offset (add/subtract fixed amount)
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

        // Process each step in order
        for (const step of stepsArray) {
          if (step && typeof step === 'object') {
            // Check if the step properties exist and apply them
            if ('type' in step && 'value' in step) {
              const stepType = step.type as string;
              const stepValue = parseFloat(step.value as string);
              
              if (!isNaN(stepValue)) {
                if (stepType === 'multiplier') {
                  calculatedRate = calculatedRate * stepValue;
                } else if (stepType === 'add_offset') {
                  calculatedRate = calculatedRate + stepValue;
                } else if (stepType === 'subtract_offset') {
                  calculatedRate = calculatedRate - stepValue;
                }
              }
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
    
    // Filter and apply only the selected adjustments
    for (const adjustmentId of selectedAdjustments) {
      const adjustment = partnerAdjustments.find(adj => adj.id === adjustmentId);
      
      if (adjustment) {
        // Apply different types of adjustments
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

    // Apply global discount from form values
    const discountAmount = adjustedRate * (values.discount / 100);
    const finalRate = adjustedRate - discountAmount;

    // Find names of selected entities for display purposes
    const partnerName = partners.find(p => p.id === values.partnerId)?.name || '';
    const planName = plans.find(p => p.id === values.planId)?.code || '';
    const categoryName = categories.find(c => c.id === values.categoryId)?.name || '';
    
    // Calculate departure date (arrival + nights)
    const departureDate = new Date(values.arrivalDate);
    departureDate.setDate(departureDate.getDate() + values.nights);

    // Return complete calculation result
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
