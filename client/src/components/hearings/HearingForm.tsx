import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { hearingFormSchema } from "@shared/schema";
import { RefreshCw, Search } from "lucide-react";

type HearingFormProps = {
  hearingId?: number;
  initialData?: z.infer<typeof hearingFormSchema>;
  onSubmitSuccess?: () => void;
};

const HEARING_TYPES = [
  "Conciliação",
  "Instrução",
  "Julgamento",
  "Administrativa"
];

const HEARING_AREAS = [
  "Civil",
  "Criminal",
  "Trabalhista",
  "Família",
  "Tributário",
  "Constitucional",
  "Comercial",
  "Administrativo"
];

export default function HearingForm({
  hearingId,
  initialData,
  onSubmitSuccess
}: HearingFormProps) {
  const [searchMode, setSearchMode] = useState<"manual" | "automatic">("manual");
  const { toast } = useToast();
  
  // Fetch jurisdictions
  const { data: jurisdictions, isLoading: isLoadingJurisdictions } = useQuery({
    queryKey: ["/api/jurisdictions"],
  });
  
  // Fetch professionals
  const { data: professionals, isLoading: isLoadingProfessionals } = useQuery({
    queryKey: ["/api/professionals"],
  });
  
  // Form definition using useForm
  const form = useForm<z.infer<typeof hearingFormSchema>>({
    resolver: zodResolver(hearingFormSchema),
    defaultValues: initialData || {
      processNumber: "",
      jurisdictionId: 0,
      date: new Date().toISOString().split('T')[0],
      time: "09:00",
      type: "Conciliação",
      area: "Civil",
      status: "pending",
      notes: ""
    },
  });
  
  // Get selected values for filtering professionals
  const selectedJurisdictionId = form.watch("jurisdictionId");
  const selectedArea = form.watch("area");
  
  // Get jurisdiction state by id
  const getJurisdictionState = (id: number) => {
    if (!jurisdictions) return null;
    const jurisdiction = jurisdictions.find(j => j.id === id);
    return jurisdiction?.state || null;
  };
  
  // Filter eligible professionals
  const eligibleProfessionals = professionals?.filter(professional => {
    if (!selectedJurisdictionId || !selectedArea) return false;
    
    const jurisdictionState = getJurisdictionState(selectedJurisdictionId);
    if (!jurisdictionState) return false;
    
    return (
      professional.active && 
      professional.jurisdictions.includes(jurisdictionState) && 
      professional.specialization === selectedArea
    );
  }) || [];
  
  // Create hearing mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof hearingFormSchema>) => {
      return apiRequest("POST", "/api/hearings", data);
    },
    onSuccess: () => {
      toast({
        title: "Audiência criada",
        description: "A audiência foi agendada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hearings"] });
      form.reset();
      onSubmitSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao criar audiência: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update hearing mutation
  const updateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof hearingFormSchema>) => {
      return apiRequest("PUT", `/api/hearings/${hearingId}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Audiência atualizada",
        description: "A audiência foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hearings"] });
      onSubmitSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar audiência: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof hearingFormSchema>) => {
    if (hearingId) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };
  
  // Handle finding available professionals
  const handleFindProfessionals = () => {
    const jurisdictionId = form.getValues("jurisdictionId");
    const area = form.getValues("area");
    
    if (!jurisdictionId || !area) {
      toast({
        title: "Informações insuficientes",
        description: "Selecione uma comarca e área do direito para buscar profissionais disponíveis.",
        variant: "destructive",
      });
      return;
    }
    
    if (eligibleProfessionals.length > 0) {
      toast({
        title: "Profissionais encontrados",
        description: `${eligibleProfessionals.length} profissionais disponíveis para essa comarca e área.`,
      });
    } else {
      toast({
        title: "Nenhum profissional encontrado",
        description: "Não há profissionais disponíveis para essa comarca e área.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <FormField
          control={form.control}
          name="processNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Número do Processo</FormLabel>
              <FormControl>
                <Input placeholder="Ex: 2023.0123.4567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="jurisdictionId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Comarca</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(parseInt(value))} 
                value={field.value ? field.value.toString() : undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a comarca" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {jurisdictions?.map((jurisdiction) => (
                    <SelectItem key={jurisdiction.id} value={jurisdiction.id.toString()}>
                      {jurisdiction.name} - {jurisdiction.city}, {jurisdiction.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Data</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="time"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Horário</FormLabel>
                <FormControl>
                  <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HEARING_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Área do Direito</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a área" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {HEARING_AREAS.map((area) => (
                      <SelectItem key={area} value={area}>
                        {area}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="professionalId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Designação de Profissional</FormLabel>
              <div className="flex flex-col space-y-2">
                <div className="flex space-x-2">
                  <Select 
                    value={searchMode} 
                    onValueChange={(value) => setSearchMode(value as "manual" | "automatic")}
                  >
                    <SelectTrigger className="w-[240px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Selecionar manualmente</SelectItem>
                      <SelectItem value="automatic">Buscar disponíveis na região</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    type="button" 
                    onClick={handleFindProfessionals}
                    disabled={!selectedJurisdictionId || !selectedArea}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Buscar
                  </Button>
                </div>
                
                {searchMode === "manual" ? (
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value ? field.value.toString() : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o profissional" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {professionals?.map((professional) => (
                        <SelectItem key={professional.id} value={professional.id.toString()}>
                          {professional.name} - {professional.type === "lawyer" ? "Advogado" : "Pretor"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    value={field.value ? field.value.toString() : undefined}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione dentre os disponíveis" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eligibleProfessionals.length === 0 ? (
                        <SelectItem value="none" disabled>
                          Nenhum profissional disponível
                        </SelectItem>
                      ) : (
                        eligibleProfessionals.map((professional) => (
                          <SelectItem key={professional.id} value={professional.id.toString()}>
                            {professional.name} - {professional.specialization}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <FormDescription>
                Se nenhum profissional for selecionado, a audiência ficará com status pendente.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Observações</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Observações adicionais sobre a audiência" 
                  className="resize-none" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {(createMutation.isPending || updateMutation.isPending) && (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            )}
            {hearingId ? "Atualizar Audiência" : "Agendar Audiência"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
