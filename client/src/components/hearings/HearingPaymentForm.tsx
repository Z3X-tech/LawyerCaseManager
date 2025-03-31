import { useMutation, useQuery } from "@tanstack/react-query";
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
import { Hearing, Professional } from "@shared/schema";
import { RefreshCw } from "lucide-react";

// Payment form schema
const paymentFormSchema = z.object({
  hearingId: z.number(),
  professionalId: z.number(),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  status: z.string().default("pending"),
  notes: z.string().optional(),
});

type HearingPaymentFormProps = {
  hearing: Hearing;
  onSubmitSuccess?: () => void;
};

export default function HearingPaymentForm({
  hearing,
  onSubmitSuccess
}: HearingPaymentFormProps) {
  const { toast } = useToast();
  
  // Fetch professional details
  const { data: professional } = useQuery({
    queryKey: ["/api/professionals", hearing.professionalId],
    enabled: !!hearing.professionalId,
  });
  
  // Form definition
  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      hearingId: hearing.id,
      professionalId: hearing.professionalId || 0,
      amount: 0,
      status: "pending",
      notes: "",
    },
  });
  
  // Create payment mutation
  const createPaymentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof paymentFormSchema>) => {
      return apiRequest("POST", "/api/payments", data);
    },
    onSuccess: () => {
      toast({
        title: "Pagamento registrado",
        description: "O pagamento foi registrado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hearings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      form.reset();
      onSubmitSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao registrar pagamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof paymentFormSchema>) => {
    createPaymentMutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <FormLabel>Processo</FormLabel>
            <div className="font-medium mt-1">
              {hearing.processNumber}
            </div>
          </div>
          
          <div>
            <FormLabel>Profissional</FormLabel>
            <div className="font-medium mt-1">
              {professional?.name || "Não designado"}
            </div>
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0.01" 
                  placeholder="0.00" 
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Informe o valor a ser pago ao profissional.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status do Pagamento</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="processing">Em processamento</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                </SelectContent>
              </Select>
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
                  placeholder="Observações sobre o pagamento" 
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
            disabled={createPaymentMutation.isPending}
          >
            {createPaymentMutation.isPending && (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            )}
            Registrar Pagamento
          </Button>
        </div>
      </form>
    </Form>
  );
}
