
import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAppData } from '@/contexts/AppDataContext';
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

// Schéma de validation du formulaire
const formSchema = z.object({
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

interface PlanRule {
  id: string;
  plan_id: string;
  base_source: string;
  steps: Json; // Changed from any[] to Json to match Supabase type
}

interface CategoryRule {
  id: string;
  category_id: string;
  base_source: string;
  formula_type: string;
  formula_multiplier: number;
  formula_offset: number;
}

interface DailyRateDetail {
  date: Date;
  baseRate: number;
  baseSource: string;
  calculatedRate: number;
}

const CalculateRate = () => {
  const { 
    partners, 
    plans, 
    categories, 
    loading, 
    getPartnerPlans,
    getPlanCategories,
    getPartnerAdjustments 
  } = useAppData();
  
  const [availablePlans, setAvailablePlans] = useState<typeof plans>([]);
  const [availableCategories, setAvailableCategories] = useState<typeof categories>([]);
  const [partnerAdjustments, setPartnerAdjustments] = useState<any[]>([]);
  const [calculationResult, setCalculationResult] = useState<{
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
  } | null>(null);
  const [planRules, setPlanRules] = useState<PlanRule | null>(null);
  const [categoryRules, setCategoryRules] = useState<CategoryRule | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nights: 1,
      discount: 0,
      adjustments: [],
    },
  });

  const watchPartnerId = form.watch("partnerId");
  const watchPlanId = form.watch("planId");

  // Mise à jour des plans disponibles lorsque le partenaire change
  useEffect(() => {
    if (watchPartnerId) {
      const planIds = getPartnerPlans(watchPartnerId);
      const filteredPlans = plans.filter(plan => planIds.includes(plan.id));
      setAvailablePlans(filteredPlans);
      
      // Réinitialiser le plan et la catégorie sélectionnés
      form.setValue("planId", "");
      form.setValue("categoryId", "");
      form.setValue("adjustments", []);
      
      // Charger les ajustements du partenaire
      const adjustments = getPartnerAdjustments(watchPartnerId);
      setPartnerAdjustments(adjustments);
    } else {
      setAvailablePlans([]);
      setPartnerAdjustments([]);
    }
  }, [watchPartnerId, plans, getPartnerPlans, getPartnerAdjustments, form]);

  // Mise à jour des catégories disponibles lorsque le plan change
  useEffect(() => {
    if (watchPlanId) {
      const categoryIds = getPlanCategories(watchPlanId);
      const filteredCategories = categories.filter(category => categoryIds.includes(category.id));
      setAvailableCategories(filteredCategories);
      
      // Réinitialiser la catégorie sélectionnée
      form.setValue("categoryId", "");
      
      // Charger les règles de plan
      fetchPlanRules(watchPlanId);
      
      // Filtrer les ajustements par plan si nécessaire
      if (watchPartnerId) {
        const adjustments = getPartnerAdjustments(watchPartnerId, watchPlanId);
        setPartnerAdjustments(adjustments);
      }
    } else {
      setAvailableCategories([]);
      setPlanRules(null);
    }
  }, [watchPlanId, categories, getPlanCategories, form, watchPartnerId, getPartnerAdjustments]);

  // Charger les règles de catégorie lorsqu'une catégorie est sélectionnée
  const watchCategoryId = form.watch("categoryId");
  useEffect(() => {
    if (watchCategoryId) {
      fetchCategoryRules(watchCategoryId);
    } else {
      setCategoryRules(null);
    }
  }, [watchCategoryId]);

  // Charger les règles du plan
  const fetchPlanRules = async (planId: string) => {
    try {
      const { data, error } = await supabase
        .from('plan_rules')
        .select('*')
        .eq('plan_id', planId)
        .single();

      if (error) {
        console.error("Erreur lors du chargement des règles de plan:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les règles du plan",
          variant: "destructive",
        });
        return;
      }

      setPlanRules(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les règles du plan",
        variant: "destructive",
      });
    }
  };

  // Charger les règles de catégorie
  const fetchCategoryRules = async (categoryId: string) => {
    try {
      const { data, error } = await supabase
        .from('category_rules')
        .select('*')
        .eq('category_id', categoryId)
        .single();

      if (error) {
        console.error("Erreur lors du chargement des règles de catégorie:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les règles de catégorie",
          variant: "destructive",
        });
        return;
      }

      setCategoryRules(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les règles de catégorie",
        variant: "destructive",
      });
    }
  };

  // Obtenir le tarif de base pour une date donnée
  const fetchDailyBaseRate = async (date: Date, baseSource: string) => {
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('daily_base_rates')
        .select('*')
        .eq('date', formattedDate)
        .single();

      if (error) {
        console.error(`Pas de tarif disponible pour la date ${formattedDate}:`, error);
        return 0;
      }

      return baseSource === 'ota_rate' ? data.ota_rate : data.travco_rate;
    } catch (error) {
      console.error("Erreur lors de la récupération du tarif de base:", error);
      return 0;
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // Vérifier les règles nécessaires
      if (!planRules) {
        toast({
          title: "Erreur",
          description: "Les règles du plan sont manquantes",
          variant: "destructive",
        });
        return;
      }

      if (!categoryRules) {
        toast({
          title: "Erreur",
          description: "Les règles de catégorie sont manquantes",
          variant: "destructive",
        });
        return;
      }

      // Tableaux pour stocker les résultats par jour
      const dailyBreakdown: DailyRateDetail[] = [];
      let subtotal = 0;

      // Calculer le tarif pour chaque jour du séjour
      for (let i = 0; i < values.nights; i++) {
        // Date du jour courant
        const currentDate = new Date(values.arrivalDate);
        currentDate.setDate(currentDate.getDate() + i);

        // Obtenir le tarif de base pour ce jour
        const baseRate = await fetchDailyBaseRate(currentDate, planRules.base_source);
        
        // Appliquer les règles de catégorie
        let calculatedRate = baseRate;
        if (categoryRules) {
          if (categoryRules.formula_type === 'multiplier') {
            calculatedRate = baseRate * categoryRules.formula_multiplier;
          }

          // Appliquer le décalage
          calculatedRate += categoryRules.formula_offset;
        }

        // Appliquer les règles du plan (étapes)
        if (planRules && planRules.steps) {
          const steps = Array.isArray(planRules.steps) ? planRules.steps : [];
          for (const step of steps) {
            if (step.type === 'multiplier') {
              calculatedRate = calculatedRate * parseFloat(step.value);
            } else if (step.type === 'add_offset') {
              calculatedRate = calculatedRate + parseFloat(step.value);
            } else if (step.type === 'subtract_offset') {
              calculatedRate = calculatedRate - parseFloat(step.value);
            }
          }
        }

        // Arrondir le tarif à 2 décimales
        calculatedRate = Math.round(calculatedRate * 100) / 100;

        // Ajouter au tableau des détails journaliers
        dailyBreakdown.push({
          date: new Date(currentDate),
          baseRate,
          baseSource: planRules.base_source,
          calculatedRate
        });

        // Ajouter au sous-total
        subtotal += calculatedRate;
      }

      // Appliquer les ajustements partenaires sélectionnés
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

      // Appliquer la remise globale
      const discountAmount = adjustedRate * (values.discount / 100);
      const finalRate = adjustedRate - discountAmount;

      // Trouver les noms des entités sélectionnées
      const partnerName = partners.find(p => p.id === values.partnerId)?.name || '';
      const planName = plans.find(p => p.id === values.planId)?.code || '';
      const categoryName = categories.find(c => c.id === values.categoryId)?.name || '';
      
      // Date de départ (arrivée + nuits)
      const departureDate = new Date(values.arrivalDate);
      departureDate.setDate(departureDate.getDate() + values.nights);

      // Définir les résultats du calcul
      setCalculationResult({
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
      });
      
      toast({
        title: "Calcul effectué",
        description: "Le tarif a été calculé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors du calcul du tarif:", error);
      toast({
        title: "Erreur",
        description: "Impossible de calculer le tarif",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Calculer un Tarif</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Formulaire de Calcul</CardTitle>
              <CardDescription>
                Remplissez les informations pour calculer le tarif d'un séjour
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date d'arrivée */}
                    <FormField
                      control={form.control}
                      name="arrivalDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Date d'arrivée</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP", { locale: fr })
                                  ) : (
                                    <span>Choisir une date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Nombre de nuits */}
                    <FormField
                      control={form.control}
                      name="nights"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre de nuits</FormLabel>
                          <FormControl>
                            <Input type="number" id="nombre_nuits" {...field} min={1} max={30} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Partenaire */}
                  <FormField
                    control={form.control}
                    name="partnerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partenaire</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={loading}
                        >
                          <FormControl>
                            <SelectTrigger id="partenaire_select">
                              <SelectValue placeholder="Sélectionnez un partenaire" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {partners.map((partner) => (
                              <SelectItem key={partner.id} value={partner.id}>
                                {partner.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Plan tarifaire */}
                  <FormField
                    control={form.control}
                    name="planId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan tarifaire</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!watchPartnerId || availablePlans.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger id="plan_select">
                              <SelectValue placeholder="Sélectionnez un plan tarifaire" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availablePlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.id}>
                                {plan.code} {plan.description && `- ${plan.description}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Catégorie */}
                  <FormField
                    control={form.control}
                    name="categoryId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catégorie de chambre</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!watchPlanId || availableCategories.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger id="categorie_select">
                              <SelectValue placeholder="Sélectionnez une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Remise */}
                  <FormField
                    control={form.control}
                    name="discount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remise (%)</FormLabel>
                        <FormControl>
                          <Input type="number" id="remise_pourcentage" {...field} min={0} max={100} />
                        </FormControl>
                        <FormDescription>
                          Pourcentage de remise à appliquer (0-100%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ajustements partenaire */}
                  {partnerAdjustments.length > 0 ? (
                    <div className="space-y-4" id="ajustements_partenaires_container">
                      <FormLabel className="block text-base font-medium">Ajustements partenaire</FormLabel>
                      {partnerAdjustments.map((adjustment) => {
                        if (adjustment.ui_control === 'checkbox') {
                          return (
                            <FormField
                              key={adjustment.id}
                              control={form.control}
                              name="adjustments"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(adjustment.id)}
                                      defaultChecked={adjustment.default_checked}
                                      onCheckedChange={(checked) => {
                                        const currentValues = field.value || [];
                                        return checked
                                          ? field.onChange([...currentValues, adjustment.id])
                                          : field.onChange(currentValues.filter((value) => value !== adjustment.id));
                                      }}
                                      data-adjustment-type={adjustment.adjustment_type}
                                      data-adjustment-value={adjustment.adjustment_value}
                                    />
                                  </FormControl>
                                  <div className="space-y-1 leading-none">
                                    <FormLabel>{adjustment.description}</FormLabel>
                                  </div>
                                </FormItem>
                              )}
                            />
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    <div id="ajustements_partenaires_container">
                      <p className="text-muted-foreground">Sélectionnez un partenaire pour voir les ajustements.</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full">Calculer le tarif</Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Résultat du calcul */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Résultat du calcul</CardTitle>
              <CardDescription>
                Détails du tarif calculé
              </CardDescription>
            </CardHeader>
            <CardContent>
              {calculationResult ? (
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
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  Remplissez le formulaire et calculez le tarif pour voir les résultats ici
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CalculateRate;
