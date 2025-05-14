
import React from 'react';
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CardContent } from "@/components/ui/card";
import { CalculationResult } from "@/types/calculateRate.types";

interface ResultDisplayProps {
  calculationResult: CalculationResult | null;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ calculationResult }) => {
  if (!calculationResult) {
    return (
      <CardContent>
        <div className="text-center py-6 text-muted-foreground">
          Remplissez le formulaire et calculez le tarif pour voir les résultats ici
        </div>
      </CardContent>
    );
  }

  return (
    <CardContent>
      <div className="space-y-6" id="resultats_calcul">
        {/* Récapitulatif du séjour */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Récapitulatif du séjour</h3>
          <ul className="space-y-1 text-sm">
            <li><span className="font-medium">Date d'arrivée:</span> {format(calculationResult.arrivalDate, 'dd MMMM yyyy', { locale: fr })}</li>
            <li><span className="font-medium">Date de départ:</span> {format(calculationResult.departureDate, 'dd MMMM yyyy', { locale: fr })}</li>
            <li><span className="font-medium">Nuits:</span> {calculationResult.nights}</li>
            <li><span className="font-medium">Partenaire:</span> {calculationResult.partnerName}</li>
            <li><span className="font-medium">Plan:</span> {calculationResult.planName}</li>
            <li><span className="font-medium">Catégorie:</span> {calculationResult.categoryName}</li>
          </ul>
        </div>

        {/* Détail des tarifs journaliers */}
        <div>
          <h3 className="text-lg font-semibold mb-2">Détail des tarifs journaliers</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Date</th>
                  <th className="text-left py-2 px-2">Tarif de base (source)</th>
                  <th className="text-right py-2 px-2">Tarif journalier calculé</th>
                </tr>
              </thead>
              <tbody>
                {calculationResult.dailyBreakdown.map((day, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2 px-2">{format(day.date, 'dd/MM/yyyy')}</td>
                    <td className="py-2 px-2">{day.baseRate.toFixed(2)} € ({day.baseSource})</td>
                    <td className="text-right py-2 px-2">{day.calculatedRate.toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Résumé des totaux */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold mb-2">Résumé des totaux</h3>
          <div className="flex justify-between">
            <span>Sous-total:</span>
            <span>{calculationResult.subtotal.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span>Ajustements partenaires:</span>
            <span>{calculationResult.adjustmentsAmount.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span>Total avant remise:</span>
            <span>{calculationResult.adjustedRate.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span>Montant de la remise ({calculationResult.discount}%):</span>
            <span>{calculationResult.discountAmount.toFixed(2)} €</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total final:</span>
            <span>{calculationResult.finalRate.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </CardContent>
  );
};
