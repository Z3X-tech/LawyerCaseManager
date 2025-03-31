import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl,
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
import { 
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn, formatCurrency, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Search, Filter, Download, Calendar, RefreshCw } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Payment, Professional, Hearing } from "@shared/schema";

// Payment form schema
const paymentFormSchema = z.object({
  hearingId: z.number(),
  professionalId: z.number(),
  amount: z.coerce.number().min(0.01, "Valor deve ser maior que zero"),
  status: z.string(),
  notes: z.string().optional(),
});

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProfessional, setFilterProfessional] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const { toast } = useToast();
  
  // Fetch payments
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["/api/payments"],
  });
  
  // Fetch professionals
  const { data: professionals, isLoading: isLoadingProfessionals } = useQuery({
    queryKey: ["/api/professionals"],
  });
  
  // Fetch hearings
  const { data: hearings, isLoading: isLoadingHearings } = useQuery({
    queryKey: ["/api/hearings"],
  });
  
  // Update payment mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof paymentFormSchema> }) => {
      return apiRequest("PUT", `/api/payments/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Pagamento atualizado",
        description: "O pagamento foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar pagamento: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form for editing a payment
  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      hearingId: 0,
      professionalId: 0,
      amount: 0,
      status: "pending",
      notes: "",
    },
  });
  
  // Handle edit form submission
  const onSubmit = (data: z.infer<typeof paymentFormSchema>) => {
    if (selectedPayment) {
      updateMutation.mutate({ id: selectedPayment.id, data });
    }
  };
  
  // Get professional name by ID
  const getProfessionalName = (id: number) => {
    if (!professionals) return "Carregando...";
    const professional = professionals.find((p: Professional) => p.id === id);
    return professional ? professional.name : "Não encontrado";
  };
  
  // Get hearing process number by ID
  const getHearingProcess = (id: number) => {
    if (!hearings) return "Carregando...";
    const hearing = hearings.find((h: Hearing) => h.id === id);
    return hearing ? hearing.processNumber : "Não encontrado";
  };
  
  // Open edit dialog with payment data
  const handleEdit = (payment: Payment) => {
    setSelectedPayment(payment);
    form.reset({
      hearingId: payment.hearingId,
      professionalId: payment.professionalId,
      amount: payment.amount,
      status: payment.status,
      notes: payment.notes || "",
    });
    setIsEditDialogOpen(true);
  };
  
  // Filter payments
  const filteredPayments = payments?.filter((payment: Payment) => {
    // Filter by tab
    const matchesTab = activeTab === "all" || 
                       (activeTab === "pending" && payment.status === "pending") ||
                       (activeTab === "processing" && payment.status === "processing") ||
                       (activeTab === "paid" && payment.status === "paid");
    
    // Filter by search term (professional name)
    const professionalName = getProfessionalName(payment.professionalId).toLowerCase();
    const hearingProcess = getHearingProcess(payment.hearingId).toLowerCase();
    const matchesSearch = professionalName.includes(searchTerm.toLowerCase()) || 
                         hearingProcess.includes(searchTerm.toLowerCase());
    
    // Filter by selected filters
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus;
    const matchesProfessional = filterProfessional === "all" || 
                               payment.professionalId.toString() === filterProfessional;
    
    return matchesTab && matchesSearch && matchesStatus && matchesProfessional;
  }) || [];
  
  // Calculate totals
  const calculateTotals = () => {
    if (!payments) return { total: 0, pending: 0, processing: 0, paid: 0 };
    
    const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const pending = payments
      .filter(payment => payment.status === "pending")
      .reduce((sum, payment) => sum + payment.amount, 0);
    const processing = payments
      .filter(payment => payment.status === "processing")
      .reduce((sum, payment) => sum + payment.amount, 0);
    const paid = payments
      .filter(payment => payment.status === "paid")
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    return { total, pending, processing, paid };
  };
  
  const totals = calculateTotals();
  
  // Handle export to CSV
  const handleExport = () => {
    if (!payments || !professionals || !hearings) return;
    
    const csvRows = [
      ["ID", "Processo", "Profissional", "Valor", "Status", "Data"],
      ...payments.map(payment => [
        payment.id.toString(),
        getHearingProcess(payment.hearingId),
        getProfessionalName(payment.professionalId),
        payment.amount.toString(),
        payment.status,
        payment.paymentDate ? formatDate(payment.paymentDate) : "-"
      ])
    ];
    
    const csvContent = csvRows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `pagamentos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render loading state
  if (isLoadingPayments || isLoadingProfessionals || isLoadingHearings) {
    return (
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-full mb-4" />
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold mb-4 sm:mb-0">Pagamentos</h1>
        
        <Button 
          variant="outline" 
          className="flex items-center"
          onClick={handleExport}
        >
          <Download className="mr-2 h-4 w-4" />
          <span>Exportar relatório</span>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500 mb-1">Total de Pagamentos</div>
            <div className="text-2xl font-semibold">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500 mb-1">Pendentes</div>
            <div className="text-2xl font-semibold text-danger">{formatCurrency(totals.pending)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500 mb-1">Em Processamento</div>
            <div className="text-2xl font-semibold text-warning">{formatCurrency(totals.processing)}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-neutral-500 mb-1">Pagos</div>
            <div className="text-2xl font-semibold text-success">{formatCurrency(totals.paid)}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Registro de Pagamentos</CardTitle>
          <CardDescription>
            Gerencie os pagamentos para profissionais que realizaram audiências.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="processing">Em processamento</TabsTrigger>
              <TabsTrigger value="paid">Pagos</TabsTrigger>
            </TabsList>
            
            <TabsContent value={activeTab} className="mt-0">
              <div className="flex flex-col md:flex-row mb-4 space-y-2 md:space-y-0 md:space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-3 h-4 w-4 text-neutral-500" />
                  <Input
                    placeholder="Buscar por profissional ou processo"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="flex space-x-2">
                  <div className="w-40">
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="processing">Em processamento</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="w-40">
                    <Select value={filterProfessional} onValueChange={setFilterProfessional}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Profissional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {professionals.map((prof: Professional) => (
                          <SelectItem key={prof.id} value={prof.id.toString()}>
                            {prof.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Processo</TableHead>
                      <TableHead>Profissional</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data do Pagamento</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          Nenhum pagamento encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment: Payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{getHearingProcess(payment.hearingId)}</TableCell>
                          <TableCell>{getProfessionalName(payment.professionalId)}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(payment.amount)}</TableCell>
                          <TableCell>
                            <div className={cn(
                              "px-2 py-1 text-xs font-medium rounded-full inline-block",
                              payment.status === "pending" && "bg-danger/10 text-danger",
                              payment.status === "processing" && "bg-warning/10 text-warning",
                              payment.status === "paid" && "bg-success/10 text-success"
                            )}>
                              {payment.status === "pending" && "Pendente"}
                              {payment.status === "processing" && "Em processamento"}
                              {payment.status === "paid" && "Pago"}
                            </div>
                          </TableCell>
                          <TableCell>
                            {payment.paymentDate ? formatDate(payment.paymentDate) : "-"}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEdit(payment)}
                            >
                              Editar
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-neutral-500">
            Mostrando {filteredPayments.length} de {payments.length} pagamentos
          </div>
        </CardFooter>
      </Card>
      
      {/* Edit Payment Dialog */}
      {selectedPayment && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Pagamento</DialogTitle>
              <DialogDescription>
                Atualize as informações de pagamento.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FormLabel>Processo</FormLabel>
                    <div className="font-medium">
                      {getHearingProcess(selectedPayment.hearingId)}
                    </div>
                  </div>
                  
                  <div>
                    <FormLabel>Profissional</FormLabel>
                    <div className="font-medium">
                      {getProfessionalName(selectedPayment.professionalId)}
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
                        <Input type="number" step="0.01" min="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
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
                
                <DialogFooter>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending && (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
