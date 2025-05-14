
import React, { useState, useEffect } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
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
import { calculateStayRate, RateCalculationResult, RateCalculationInput } from '@/utils/rateCalculation';
import { useToast } from "@/components/ui/use-toast";

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
  const [calculationResult, setCalculationResult] = useState<RateCalculationResult | null>(null);
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
      
      // Filtrer les ajustements par plan si nécessaire
      if (watchPartnerId) {
        const adjustments = getPartnerAdjustments(watchPartnerId, watchPlanId);
        setPartnerAdjustments(adjustments);
      }
    } else {
      setAvailableCategories([]);
    }
  }, [watchPlanId, categories, getPlanCategories, form, watchPartnerId, getPartnerAdjustments]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    try {
      // Préparer les données pour le calcul
      const calculationInput: RateCalculationInput = {
        arrivalDate: values.arrivalDate,
        nights: values.nights,
        partnerId: values.partnerId,
        planId: values.planId,
        categoryId: values.categoryId,
        discount: values.discount,
        selectedAdjustments: values.adjustments,
      };
      
      // Calculer le tarif
      const result = calculateStayRate(calculationInput);
      setCalculationResult(result);
      
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
                            <Input type="number" {...field} min={1} max={30} />
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
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un partenaire" />
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
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un plan tarifaire" />
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
                        <FormLabel>Catégorie</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!watchPlanId || availableCategories.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une catégorie" />
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
                          <Input type="number" {...field} min={0} max={100} />
                        </FormControl>
                        <FormDescription>
                          Pourcentage de remise à appliquer (0-100%)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Ajustements partenaire */}
                  {partnerAdjustments.length > 0 && (
                    <div className="space-y-4">
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
                <div className="space-y-4">
                  <div className="text-2xl font-bold">
                    {calculationResult.finalRate.toFixed(2)} €
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Détail du calcul:</h3>
                    <ul className="space-y-1">
                      {calculationResult.breakdown.map((item, index) => (
                        <li key={index} className="flex justify-between">
                          <span>{item.description}</span>
                          <span>{item.amount.toFixed(2)} €</span>
                        </li>
                      ))}
                    </ul>
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
