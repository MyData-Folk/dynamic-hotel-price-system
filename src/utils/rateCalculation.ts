
// Types pour les entrées du formulaire
export interface RateCalculationInput {
  arrivalDate: Date;
  nights: number;
  partnerId: string;
  planId: string;
  categoryId: string;
  discount: number;
  selectedAdjustments: string[]; // IDs des ajustements partenaires sélectionnés
}

// Types pour les résultats du calcul
export interface RateCalculationResult {
  baseRate: number;
  adjustedRate: number;
  finalRate: number;
  breakdown: {
    description: string;
    amount: number;
  }[];
}

// Fonction principale de calcul
export const calculateStayRate = (input: RateCalculationInput): RateCalculationResult => {
  // Simulation du calcul - à remplacer par la vraie logique
  // Dans une implémentation réelle, nous ferions des appels à l'API/DB pour obtenir les tarifs de base
  // et appliquer les règles basées sur les plan_rules, category_rules, etc.
  
  const baseRate = 100 * input.nights; // Tarif de base simple pour la simulation
  
  // Simuler des ajustements basés sur les ajustements sélectionnés
  const adjustments = input.selectedAdjustments.length * 5; // 5€ par ajustement pour la simulation
  
  const adjustedRate = baseRate - adjustments;
  
  // Appliquer la remise
  const discountAmount = adjustedRate * (input.discount / 100);
  const finalRate = adjustedRate - discountAmount;
  
  // Créer une ventilation des coûts pour l'affichage
  const breakdown = [
    { description: "Tarif de base", amount: baseRate },
    { description: "Ajustements", amount: -adjustments },
    { description: `Remise (${input.discount}%)`, amount: -discountAmount }
  ];
  
  return {
    baseRate,
    adjustedRate,
    finalRate,
    breakdown
  };
};
