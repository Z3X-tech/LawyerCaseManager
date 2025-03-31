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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Search, Plus, RefreshCw, MapPin } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { jurisdictionFormSchema } from "@shared/schema";
import { z } from "zod";

type Jurisdiction = {
  id: number;
  name: string;
  state: string;
  city: string;
  address: string;
};

export default function JurisdictionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterState, setFilterState] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<Jurisdiction | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch jurisdictions
  const { data: jurisdictions, isLoading } = useQuery({
    queryKey: ["/api/jurisdictions"],
  });
  
  // Get unique states for filter
  const uniqueStates = jurisdictions ? 
    Array.from(new Set(jurisdictions.map((j: Jurisdiction) => j.state))).sort() : 
    [];
  
  // Filter jurisdictions
  const filteredJurisdictions = jurisdictions?.filter((jurisdiction: Jurisdiction) => {
    const matchesSearch = jurisdiction.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          jurisdiction.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState = !filterState || jurisdiction.state === filterState;
    return matchesSearch && matchesState;
  }) || [];
  
  // Create jurisdiction mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof jurisdictionFormSchema>) => {
      return apiRequest("POST", "/api/jurisdictions", data);
    },
    onSuccess: () => {
      toast({
        title: "Comarca adicionada",
        description: "A comarca foi adicionada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jurisdictions"] });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao adicionar comarca: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update jurisdiction mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof jurisdictionFormSchema> }) => {
      return apiRequest("PUT", `/api/jurisdictions/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Comarca atualizada",
        description: "A comarca foi atualizada com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jurisdictions"] });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao atualizar comarca: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete jurisdiction mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/jurisdictions/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Comarca removida",
        description: "A comarca foi removida com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/jurisdictions"] });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Falha ao remover comarca: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form for adding a new jurisdiction
  const form = useForm<z.infer<typeof jurisdictionFormSchema>>({
    resolver: zodResolver(jurisdictionFormSchema),
    defaultValues: {
      name: "",
      state: "",
      city: "",
      address: "",
    },
  });
  
  // Form for editing a jurisdiction
  const editForm = useForm<z.infer<typeof jurisdictionFormSchema>>({
    resolver: zodResolver(jurisdictionFormSchema),
    defaultValues: {
      name: "",
      state: "",
      city: "",
      address: "",
    },
  });
  
  // Handle form submission
  const onSubmit = (data: z.infer<typeof jurisdictionFormSchema>) => {
    createMutation.mutate(data);
  };
  
  // Handle edit form submission
  const onEditSubmit = (data: z.infer<typeof jurisdictionFormSchema>) => {
    if (selectedJurisdiction) {
      updateMutation.mutate({ id: selectedJurisdiction.id, data });
    }
  };
  
  // Handle delete jurisdiction
  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja remover esta comarca?")) {
      deleteMutation.mutate(id);
    }
  };
  
  // Open edit dialog with jurisdiction data
  const handleEdit = (jurisdiction: Jurisdiction) => {
    setSelectedJurisdiction(jurisdiction);
    editForm.reset({
      name: jurisdiction.name,
      state: jurisdiction.state,
      city: jurisdiction.city,
      address: jurisdiction.address,
    });
    setIsEditDialogOpen(true);
  };
  
  // Render loading state
  if (isLoading) {
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
        <h1 className="text-2xl font-semibold mb-4 sm:mb-0">Comarcas</h1>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center">
              <Plus className="mr-2 h-4 w-4" />
              <span>Nova Comarca</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Comarca</DialogTitle>
              <DialogDescription>
                Preencha os dados da comarca que deseja cadastrar.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Comarca</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Foro Central Cível" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: SP" {...field} />
                        </FormControl>
                        <FormDescription>
                          Use a sigla do estado (UF).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: São Paulo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Praça João Mendes, s/n - Centro" 
                          className="resize-none" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <DialogFooter>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending && (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Lista de Comarcas</CardTitle>
          <CardDescription>
            Gerencie as comarcas onde são realizadas as audiências.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row mb-4 space-y-2 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-3 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Buscar por nome ou cidade"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="w-40">
              <select
                className="w-full h-10 rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={filterState}
                onChange={(e) => setFilterState(e.target.value)}
              >
                <option value="">Todos os estados</option>
                {uniqueStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredJurisdictions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      Nenhuma comarca encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredJurisdictions.map((jurisdiction: Jurisdiction) => (
                    <TableRow key={jurisdiction.id}>
                      <TableCell className="font-medium">{jurisdiction.name}</TableCell>
                      <TableCell>{jurisdiction.city}</TableCell>
                      <TableCell>{jurisdiction.state}</TableCell>
                      <TableCell>{jurisdiction.address}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEdit(jurisdiction)}
                          >
                            Editar
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(jurisdiction.id)}
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
            Mostrando {filteredJurisdictions.length} de {jurisdictions.length} comarcas
          </div>
        </CardFooter>
      </Card>
      
      {/* Edit Jurisdiction Dialog */}
      {selectedJurisdiction && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Comarca</DialogTitle>
              <DialogDescription>
                Atualize os dados da comarca.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 py-4">
                <FormField
                  control={editForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Comarca</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Foro Central Cível" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: SP" {...field} />
                        </FormControl>
                        <FormDescription>
                          Use a sigla do estado (UF).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={editForm.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: São Paulo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={editForm.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Ex: Praça João Mendes, s/n - Centro" 
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
