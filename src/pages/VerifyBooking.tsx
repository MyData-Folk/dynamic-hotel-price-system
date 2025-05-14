import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { useAppData } from '@/contexts/AppDataContext';
import { calculateStayRate, RateCalculationInput, RateCalculationResult } from '@/utils/rateCalculation';

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Schéma de validation pour le formulaire
const formSchema = z.object({
  arrivalDate: z.date({
    required_error: "Veuillez sélectionner une date d'arrivée.",
  }),
  nights: z.number({
    required_error: "Veuillez spécifier le nombre de nuits.",
  }).min(1, "Minimum 1 nuit requise").max(30, "Maximum 30 nuits autorisées"),
  partnerId: z.string().min(1, "Veuillez sélectionner un partenaire"),
  planId: z.string().min(1, "Veuillez sélectionner un plan"),
  categoryId: z.string().min(1, "Veuillez sélectionner une catégorie"),
  discount: z.number().min(0, "La remise ne peut pas être négative").max(100, "La remise ne peut pas dépasser 100%"),
  receivedTotal: z.number().min(0, "Le montant ne peut pas être négatif"),
});

type FormValues = z.infer<typeof formSchema>;

const VerifyBooking = () => {
  const { partners, plans, categories, getPartnerPlans, getPlanCategories, getPartnerAdjustments, loading } = useAppData();
  const [result, setResult] = useState<RateCalculationResult | null>(null);
  const [selectedAdjustments, setSelectedAdjustments] = useState<string[]>([]);
  const [variance, setVariance] = useState<{ amount: number; status: 'ok' | 'discrepancy' } | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      arrivalDate: new Date(),
      nights: 1,
      discount: 0,
      receivedTotal: 0,
    },
  });

  const watchPartnerId = form.watch('partnerId');
  const watchPlanId = form.watch('planId');

  // Récupérer les plans disponibles pour le partenaire sélectionné
  const availablePlans = watchPartnerId
    ? getPartnerPlans(watchPartnerId).map(planId => {
        const plan = plans.find(p => p.id === planId);
        return plan || null;
      }).filter(Boolean)
    : [];

  // Récupérer les catégories disponibles pour le plan sélectionné
  const availableCategories = watchPlanId
    ? getPlanCategories(watchPlanId).map(categoryId => {
        const category = categories.find(c => c.id === categoryId);
        return category || null;
      }).filter(Boolean)
    : [];

  // Récupérer les ajustements disponibles pour le partenaire sélectionné
  const availableAdjustments = watchPartnerId && watchPlanId
    ? getPartnerAdjustments(watchPartnerId, watchPlanId)
    : [];

  const handleAdjustmentChange = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAdjustments(prev => [...prev, id]);
    } else {
      setSelectedAdjustments(prev => prev.filter(adjId => adjId !== id));
    }
  };

  const onSubmit = (values: FormValues) => {
    try {
      const calculationInput: RateCalculationInput = {
        arrivalDate: values.arrivalDate,
        nights: values.nights,
        partnerId: values.partnerId,
        planId: values.planId,
        categoryId: values.categoryId,
        discount: values.discount,
        selectedAdjustments,
      };

      const calculationResult = calculateStayRate(calculationInput);
      setResult(calculationResult);

      // Calculer l'écart entre le total reçu et le total calculé
      const difference = values.receivedTotal - calculationResult.finalRate;
      setVariance({
        amount: difference,
        status: Math.abs(difference) < 0.01 ? 'ok' : 'discrepancy'
      });

      toast({
        title: "Vérification terminée",
        description: "La comparaison a été effectuée avec succès.",
      });

    } catch (error) {
      console.error("Erreur lors du calcul :", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du calcul. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  // Réinitialiser les sélections lorsque le partenaire change
  React.useEffect(() => {
    if (watchPartnerId) {
      form.setValue('planId', '');
      form.setValue('categoryId', '');
      setSelectedAdjustments([]);
    }
  }, [watchPartnerId, form]);

  // Réinitialiser la catégorie lorsque le plan change
  React.useEffect(() => {
    if (watchPlanId) {
      form.setValue('categoryId', '');
    }
  }, [watchPlanId, form]);

  // Initialiser les ajustements par défaut
  React.useEffect(() => {
    if (watchPartnerId && watchPlanId) {
      const adjustments = getPartnerAdjustments(watchPartnerId, watchPlanId);
      const defaultSelected = adjustments
        .filter(adj => adj.default_checked)
        .map(adj => adj.id);
      
      setSelectedAdjustments(defaultSelected);
    }
  }, [watchPartnerId, watchPlanId, getPartnerAdjustments]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-lg">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Vérifier une Réservation</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Card className="p-6">
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
                                className="w-full pl-3 text-left font-normal"
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
                              disabled={(date) => date < new Date()}
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
                          <Input
                            type="number"
                            min={1}
                            max={30}
                            {...form.register("nights", {
                              valueAsNumber: true,
                            })}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Partenaire */}
                  <FormField
                    control={form.control}
                    name="partnerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Partenaire</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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

                  {/* Plan */}
                  <FormField
                    control={form.control}
                    name="planId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          disabled={!watchPartnerId || availablePlans.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner un plan" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availablePlans.map((plan) => (
                              <SelectItem key={plan!.id} value={plan!.id}>
                                {plan!.code} {plan!.description && `- ${plan!.description}`}
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
                          defaultValue={field.value}
                          disabled={!watchPlanId || availableCategories.length === 0}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Sélectionner une catégorie" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCategories.map((category) => (
                              <SelectItem key={category!.id} value={category!.id}>
                                {category!.name}
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
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.01}
                            {...form.register("discount", {
                              valueAsNumber: true,
                            })}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Montant Total Reçu */}
                  <FormField
                    control={form.control}
                    name="receivedTotal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Montant Total Reçu (€)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            {...form.register("receivedTotal", {
                              valueAsNumber: true,
                            })}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Ajustements partenaires */}
                {availableAdjustments.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-medium text-base">Ajustements disponibles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {availableAdjustments.map((adjustment) => {
                        if (adjustment.ui_control === 'checkbox') {
                          return (
                            <div key={adjustment.id} className="flex items-start space-x-2">
                              <Checkbox
                                id={adjustment.id}
                                checked={selectedAdjustments.includes(adjustment.id)}
                                onCheckedChange={(checked) => handleAdjustmentChange(adjustment.id, !!checked)}
                              />
                              <Label
                                htmlFor={adjustment.id}
                                className="leading-tight cursor-pointer"
                              >
                                {adjustment.description}
                              </Label>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  </div>
                )}

                <Button type="submit" className="w-full">
                  Vérifier la réservation
                </Button>
              </form>
            </Form>
          </Card>
        </div>

        <div className="lg:col-span-1">
          {result && (
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Résultat</h2>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-muted-foreground">Total calculé</span>
                  <span className="font-semibold">{result.finalRate.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm text-muted-foreground">Total reçu</span>
                  <span className="font-semibold">{form.getValues("receivedTotal").toFixed(2)} €</span>
                </div>
                
                {variance && (
                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Écart</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={variance.status === 'ok' ? "outline" : "destructive"}>
                          {variance.status === 'ok' ? 'Correct' : 'Écart'}
                        </Badge>
                        <span className={`font-bold ${variance.amount > 0 ? 'text-green-600' : variance.amount < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                          {variance.amount.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <h3 className="font-medium text-base mb-2">Détails du calcul</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.breakdown.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.amount.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">{result.finalRate.toFixed(2)} €</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>

              {/* Détails quotidiens */}
              <h3 className="font-medium text-base mt-6 mb-2">Détail par jour</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Tarif de base</TableHead>
                    <TableHead className="text-right">Tarif ajusté</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.dailyBreakdown.map((day, index) => (
                    <TableRow key={index}>
                      <TableCell>{format(day.date, 'dd/MM/yyyy')}</TableCell>
                      <TableCell className="text-right">{day.baseRate.toFixed(2)} €</TableCell>
                      <TableCell className="text-right">{day.adjustedRate.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyBooking;
