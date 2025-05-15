
import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { FormValues, formSchema } from "@/types/calculateRate.types";
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
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { CardContent } from "@/components/ui/card";

interface RateFormProps {
  partners: any[];
  plans: any[];
  categories: any[];
  loading: boolean;
  availablePlans: any[];
  availableCategories: any[];
  partnerAdjustments: any[];
  getPartnerPlans: (partnerId: string) => string[];
  getPlanCategories: (planId: string) => string[];
  getPartnerAdjustments: (partnerId: string, planId?: string) => any[];
  setAvailablePlans: React.Dispatch<React.SetStateAction<any[]>>;
  setAvailableCategories: React.Dispatch<React.SetStateAction<any[]>>;
  setPartnerAdjustments: React.Dispatch<React.SetStateAction<any[]>>;
  onSubmit: (values: FormValues) => Promise<void>;
  onPlanChange?: (planId: string) => void;
  onCategoryChange?: (categoryId: string) => void;
}

export const RateForm: React.FC<RateFormProps> = ({
  partners,
  plans,
  categories,
  loading,
  availablePlans,
  availableCategories,
  partnerAdjustments,
  getPartnerPlans,
  getPlanCategories,
  getPartnerAdjustments,
  setAvailablePlans,
  setAvailableCategories,
  setPartnerAdjustments,
  onSubmit,
  onPlanChange,
  onCategoryChange
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nights: 1,
      discount: 0,
      adjustments: [],
    },
  });

  const watchPartnerId = form.watch("partnerId");
  const watchPlanId = form.watch("planId");

  // Update available plans when partner changes
  useEffect(() => {
    if (watchPartnerId) {
      const planIds = getPartnerPlans(watchPartnerId);
      const filteredPlans = plans.filter(plan => planIds.includes(plan.id));
      setAvailablePlans(filteredPlans);
      
      // Reset selected plan and category
      form.setValue("planId", "");
      form.setValue("categoryId", "");
      form.setValue("adjustments", []);
      
      // Load partner adjustments
      const adjustments = getPartnerAdjustments(watchPartnerId);
      setPartnerAdjustments(adjustments);
    } else {
      setAvailablePlans([]);
      setPartnerAdjustments([]);
    }
  }, [watchPartnerId, plans, getPartnerPlans, getPartnerAdjustments, form, setAvailablePlans, setPartnerAdjustments]);

  // Update available categories when plan changes
  useEffect(() => {
    if (watchPlanId) {
      const categoryIds = getPlanCategories(watchPlanId);
      const filteredCategories = categories.filter(category => categoryIds.includes(category.id));
      setAvailableCategories(filteredCategories);
      
      // Reset selected category
      form.setValue("categoryId", "");
      
      // Filter adjustments by plan if needed
      if (watchPartnerId) {
        const adjustments = getPartnerAdjustments(watchPartnerId, watchPlanId);
        setPartnerAdjustments(adjustments);
      }

      // Appeler la fonction onPlanChange pour charger les règles du plan
      if (onPlanChange) {
        onPlanChange(watchPlanId);
      }
    } else {
      setAvailableCategories([]);
    }
  }, [watchPlanId, categories, getPlanCategories, form, watchPartnerId, getPartnerAdjustments, setAvailableCategories, setPartnerAdjustments, onPlanChange]);

  // Observer les changements de catégorie pour charger les règles correspondantes
  const watchCategoryId = form.watch("categoryId");
  
  useEffect(() => {
    if (watchCategoryId && onCategoryChange) {
      onCategoryChange(watchCategoryId);
    }
  }, [watchCategoryId, onCategoryChange]);

  return (
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
  );
};
