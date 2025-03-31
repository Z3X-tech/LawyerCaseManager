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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Search, Filter, Plus } from "lucide-react";
import HearingForm from "@/components/hearings/HearingForm";
import HearingUploadForm from "@/components/hearings/HearingUploadForm";
import HearingPaymentForm from "@/components/hearings/HearingPaymentForm";
import { Hearing, Professional, Jurisdiction } from "@shared/schema";

export default function HearingsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterJurisdiction, setFilterJurisdiction] = useState("all");
  const [isAddHearingDialogOpen, setIsAddHearingDialogOpen] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch hearings
  const { data: hearings, isLoading: isLoadingHearings } = useQuery({
    queryKey: ["/api/hearings"],
  });
  
  // Fetch professionals
  const { data: professionals, isLoading: isLoadingProfessionals } = useQuery({
    queryKey: ["/api/professionals"],
  });
  
  // Fetch jurisdictions
  const { data: jurisdictions, isLoading: isLoadingJurisdictions } = useQuery({
    queryKey: ["/api/jurisdictions"],
  });
  
  // Filter hearings
  const filteredHearings = hearings?.filter((hearing: Hearing) => {
    const matchesSearch = hearing.processNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || hearing.status === filterStatus;
    const matchesJurisdiction = filterJurisdiction === "all" || hearing.jurisdictionId.toString() === filterJurisdiction;
    return matchesSearch && matchesStatus && matchesJurisdiction;
  }) || [];
  
  // Get professional name by ID
  const getProfessionalName = (id: number) => {
    const professional = professionals?.find((p: Professional) => p.id === id);
    return professional ? professional.name : "Não designado";
  };
  
  // Get jurisdiction name by ID
  const getJurisdictionName = (id: number) => {
    const jurisdiction = jurisdictions?.find((j: Jurisdiction) => j.id === id);
    return jurisdiction ? `${jurisdiction.name} - ${jurisdiction.city}, ${jurisdiction.state}` : "Não encontrada";
  };
  
  // Delete hearing mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/hearings/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Audiência removida",
        description: "A audiência foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hearings"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao remover audiência: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle delete hearing
  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover esta audiência?")) {
      deleteMutation.mutate(id);
    }
  };
  
  // Assign professional mutation
  const assignMutation = useMutation({
    mutationFn: async ({ hearingId, professionalId }: { hearingId: number; professionalId: number }) => {
      return apiRequest("PUT", `/api/hearings/${hearingId}`, {
        professionalId,
        status: "assigned",
      });
    },
    onSuccess: () => {
      toast({
        title: "Profissional designado",
        description: "O profissional foi designado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/hearings"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao designar profissional: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Filter eligible professionals for a hearing
  const getEligibleProfessionals = (hearing: Hearing) => {
    if (!professionals || !jurisdictions) return [];
    
    const jurisdiction = jurisdictions.find((j: Jurisdiction) => j.id === hearing.jurisdictionId);
    if (!jurisdiction) return [];
    
    return professionals.filter((p: Professional) => {
      return p.active && p.jurisdictions.includes(jurisdiction.state) && p.specialization === hearing.area;
    });
  };
  
  // Render loading state
  if (isLoadingHearings || isLoadingProfessionals || isLoadingJurisdictions) {
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
            <div className="flex mb-4 space-x-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold mb-4 sm:mb-0">Audiências</h1>
        
        <Dialog open={isAddHearingDialogOpen} onOpenChange={setIsAddHearingDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              <span>Nova Audiência</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Audiência</DialogTitle>
              <DialogDescription>
                Preencha os dados da audiência que deseja agendar.
              </DialogDescription>
            </DialogHeader>
            
            <HearingForm 
              onSubmitSuccess={() => {
                setIsAddHearingDialogOpen(false);
                toast({
                  title: "Audiência agendada",
                  description: "A audiência foi agendada com sucesso.",
                });
                queryClient.invalidateQueries({ queryKey: ["/api/hearings"] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Audiências</CardTitle>
          <CardDescription>
            Gerencie todas as audiências agendadas, designações e status.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row mb-4 space-y-2 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-3 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Buscar por número do processo"
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
                    <SelectItem value="assigned">Designada</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-40">
                <Select value={filterJurisdiction} onValueChange={setFilterJurisdiction}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Comarca" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {jurisdictions.map((jurisdiction: Jurisdiction) => (
                      <SelectItem key={jurisdiction.id} value={jurisdiction.id.toString()}>
                        {jurisdiction.name}
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
                  <TableHead>Data</TableHead>
                  <TableHead>Comarca</TableHead>
                  <TableHead>Profissional</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHearings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      Nenhuma audiência encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHearings.map((hearing: Hearing) => (
                    <TableRow key={hearing.id}>
                      <TableCell className="font-medium">{hearing.processNumber}</TableCell>
                      <TableCell>
                        {formatDate(hearing.date)} - {hearing.time}
                      </TableCell>
                      <TableCell>{getJurisdictionName(hearing.jurisdictionId)}</TableCell>
                      <TableCell>
                        {hearing.professionalId ? (
                          getProfessionalName(hearing.professionalId)
                        ) : (
                          <Select
                            onValueChange={(value) => {
                              assignMutation.mutate({
                                hearingId: hearing.id,
                                professionalId: parseInt(value)
                              });
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue placeholder="Designar" />
                            </SelectTrigger>
                            <SelectContent>
                              {getEligibleProfessionals(hearing).map((prof: Professional) => (
                                <SelectItem key={prof.id} value={prof.id.toString()}>
                                  {prof.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className={cn(
                          "px-2 py-1 text-xs font-medium rounded-full inline-block",
                          hearing.status === "pending" && "bg-warning/10 text-warning",
                          hearing.status === "assigned" && "bg-primary/10 text-primary",
                          hearing.status === "completed" && "bg-success/10 text-success",
                          hearing.status === "cancelled" && "bg-danger/10 text-danger"
                        )}>
                          {hearing.status === "pending" && "Pendente"}
                          {hearing.status === "assigned" && "Designada"}
                          {hearing.status === "completed" && "Concluída"}
                          {hearing.status === "cancelled" && "Cancelada"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          {hearing.status === "completed" && !hearing.minutesUploaded && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedHearing(hearing);
                                setIsUploadDialogOpen(true);
                              }}
                            >
                              Anexar Ata
                            </Button>
                          )}
                          
                          {hearing.status === "completed" && hearing.minutesUploaded && hearing.paymentStatus === "pending" && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedHearing(hearing);
                                setIsPaymentDialogOpen(true);
                              }}
                            >
                              Registrar Pagamento
                            </Button>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(hearing.id)}
                          >
                            Excluir
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div className="text-sm text-neutral-500">
            Mostrando {filteredHearings.length} de {hearings.length} audiências
          </div>
        </CardFooter>
      </Card>
      
      {/* Upload Minutes Dialog */}
      {selectedHearing && (
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Anexar Ata de Audiência</DialogTitle>
              <DialogDescription>
                Envie a ata para o processo {selectedHearing.processNumber}
              </DialogDescription>
            </DialogHeader>
            
            <HearingUploadForm 
              hearingId={selectedHearing.id}
              onSubmitSuccess={() => {
                setIsUploadDialogOpen(false);
                toast({
                  title: "Ata anexada",
                  description: "A ata foi anexada com sucesso.",
                });
                queryClient.invalidateQueries({ queryKey: ["/api/hearings"] });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
      
      {/* Payment Dialog */}
      {selectedHearing && (
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
              <DialogDescription>
                Informe o valor para pagamento do profissional pela audiência.
              </DialogDescription>
            </DialogHeader>
            
            <HearingPaymentForm 
              hearing={selectedHearing}
              onSubmitSuccess={() => {
                setIsPaymentDialogOpen(false);
                toast({
                  title: "Pagamento registrado",
                  description: "O pagamento foi registrado com sucesso.",
                });
                queryClient.invalidateQueries({ queryKey: ["/api/hearings"] });
                queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
