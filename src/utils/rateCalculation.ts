
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

// Types pour les détails quotidiens
export interface DailyRateDetail {
  date: Date;
  baseRate: number;
  adjustedRate: number;
}

// Types pour les résultats du calcul
export interface RateCalculationResult {
  baseRate: number;
  adjustedRate: number;
  finalRate: number;
  dailyBreakdown: DailyRateDetail[];
  breakdown: {
    description: string;
    amount: number;
  }[];
}

// Fonction principale de calcul
export const calculateStayRate = (input: RateCalculationInput): RateCalculationResult => {
  // Initialiser les totaux
  let totalBaseRate = 0;
  let totalAdjustedRate = 0;
  const dailyBreakdown: DailyRateDetail[] = [];
  
  // Calculer le tarif pour chaque jour du séjour
  for (let i = 0; i < input.nights; i++) {
    // Calculer la date du jour
    const currentDate = new Date(input.arrivalDate);
    currentDate.setDate(currentDate.getDate() + i);
    
    // Dans une implémentation réelle, nous récupérerions le tarif spécifique de cette date depuis la DB
    // Pour la simulation, nous utilisons un tarif de base avec une petite variation selon le jour de la semaine
    const dayOfWeek = currentDate.getDay(); // 0 = dimanche, 6 = samedi
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    
    // Tarif de base légèrement plus élevé pour les weekends
    const dailyBaseRate = isWeekend ? 120 : 100;
    
    // Ajustements pour ce jour
    // Dans une vraie implémentation, nous appliquerions les règles spécifiques du plan et de la catégorie
    const dailyAdjustments = input.selectedAdjustments.length * 5; // 5€ par ajustement pour la simulation
    const dailyAdjustedRate = dailyBaseRate - dailyAdjustments;
    
    // Ajouter aux totaux
    totalBaseRate += dailyBaseRate;
    totalAdjustedRate += dailyAdjustedRate;
    
    // Enregistrer le détail de ce jour
    dailyBreakdown.push({
      date: new Date(currentDate),
      baseRate: dailyBaseRate,
      adjustedRate: dailyAdjustedRate
    });
  }
  
  // Appliquer la remise globale
  const discountAmount = totalAdjustedRate * (input.discount / 100);
  const finalRate = totalAdjustedRate - discountAmount;
  
  // Créer une ventilation des coûts pour l'affichage
  const breakdown = [
    { description: "Tarif de base", amount: totalBaseRate },
    { description: "Ajustements", amount: -(totalBaseRate - totalAdjustedRate) },
    { description: `Remise (${input.discount}%)`, amount: -discountAmount }
  ];
  
  return {
    baseRate: totalBaseRate,
    adjustedRate: totalAdjustedRate,
    finalRate,
    dailyBreakdown,
    breakdown
  };
};
