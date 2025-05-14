
import { z } from "zod";
import { Json } from "@/integrations/supabase/types";

// Form schema for the rate calculation form
export const formSchema = z.object({
  arrivalDate: z.date({
    required_error: "La date d'arrivée est requise",
  }),
  nights: z.coerce.number()
    .min(1, "Minimum 1 nuit")
    .max(30, "Maximum 30 nuits"),
  partnerId: z.string({
    required_error: "Le partenaire est requis",
  }),
  planId: z.string({
    required_error: "Le plan tarifaire est requis",
  }),
  categoryId: z.string({
    required_error: "La catégorie est requise",
  }),
  discount: z.coerce.number()
    .min(0, "Minimum 0%")
    .max(100, "Maximum 100%")
    .default(0),
  adjustments: z.array(z.string()).default([]),
});

export type FormValues = z.infer<typeof formSchema>;

// Define interfaces for rules
export interface PlanRuleStep {
  type: string;
  value: string;
}

export interface PlanRule {
  id: string;
  plan_id: string;
  base_source: string;
  steps: Json;
}

export interface CategoryRule {
  id: string;
  category_id: string;
  base_source: string;
  formula_type: string;
  formula_multiplier: number;
  formula_offset: number;
}

// Interface for daily rate details
export interface DailyRateDetail {
  date: Date;
  baseRate: number;
  baseSource: string;
  calculatedRate: number;
}

// Interface for calculation result
export interface CalculationResult {
  finalRate: number;
  subtotal: number;
  adjustmentsAmount: number;
  discountAmount: number;
  adjustedRate: number;
  dailyBreakdown: DailyRateDetail[];
  arrivalDate: Date;
  departureDate: Date;
  nights: number;
  partnerId: string;
  planId: string;
  categoryId: string;
  discount: number;
  partnerName?: string;
  planName?: string;
  categoryName?: string;
}
