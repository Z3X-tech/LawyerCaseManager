import { 
  Card, 
  CardContent, 
  CardHeader,
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn, formatCurrency, formatDate, getPaymentStatusColor } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";

type FinancialSummaryProps = {
  onViewReportClick: () => void;
};

export default function FinancialSummary({ onViewReportClick }: FinancialSummaryProps) {
  const [period, setPeriod] = useState("month");
  
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
  
  // Fetch jurisdictions
  const { data: jurisdictions, isLoading: isLoadingJurisdictions } = useQuery({
    queryKey: ["/api/jurisdictions"],
  });
  
  // Helper function to get professional name
  const getProfessionalName = (id: number) => {
    if (!professionals) return "Carregando...";
    const professional = professionals.find(p => p.id === id);
    return professional ? professional.name : "Não encontrado";
  };
  
  // Helper function to get process number
  const getProcessNumber = (hearingId: number) => {
    if (!hearings) return "Carregando...";
    const hearing = hearings.find(h => h.id === hearingId);
    return hearing ? hearing.processNumber : "Não encontrado";
  };
  
  // Helper function to get jurisdiction
  const getJurisdiction = (hearingId: number) => {
    if (!hearings || !jurisdictions) return "Carregando...";
    const hearing = hearings.find(h => h.id === hearingId);
    if (!hearing) return "Não encontrado";
    
    const jurisdiction = jurisdictions.find(j => j.id === hearing.jurisdictionId);
    return jurisdiction ? `${jurisdiction.city}, ${jurisdiction.state}` : "Não encontrado";
  };
  
  // Filter payments by period
  const filterPaymentsByPeriod = () => {
    if (!payments) return [];
    
    const now = new Date();
    let cutoffDate: Date;
    
    if (period === "week") {
      cutoffDate = new Date(now);
      cutoffDate.setDate(now.getDate() - 7);
    } else if (period === "month") {
      cutoffDate = new Date(now);
      cutoffDate.setMonth(now.getMonth() - 1);
    } else {
      cutoffDate = new Date(now);
      cutoffDate.setFullYear(now.getFullYear() - 1);
    }
    
    return payments
      .filter(payment => {
        const paymentDate = payment.createdAt ? new Date(payment.createdAt) : new Date();
        return paymentDate >= cutoffDate;
      })
      .sort((a, b) => {
        // Sort by created date descending
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date();
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date();
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5); // Limit to 5 recent entries
  };
  
  const filteredPayments = filterPaymentsByPeriod();
  
  if (isLoadingPayments || isLoadingProfessionals || isLoadingHearings || isLoadingJurisdictions) {
    return (
      <Card>
        <CardHeader className="flex justify-between pb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-4">
        <h3 className="font-semibold">Resumo Financeiro - {
          period === "week" ? "Últimos 7 dias" : 
          period === "month" ? "Este mês" : "Este ano"
        }</h3>
        <div className="flex space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-8 text-sm w-[130px]">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-4 w-4 text-primary" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="bg-neutral-50">Data</TableHead>
                <TableHead className="bg-neutral-50">Processo</TableHead>
                <TableHead className="bg-neutral-50">Profissional</TableHead>
                <TableHead className="bg-neutral-50">Comarca</TableHead>
                <TableHead className="bg-neutral-50">Valor</TableHead>
                <TableHead className="bg-neutral-50">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4 text-neutral-500">
                    Não há pagamentos registrados neste período.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPayments.map((payment) => {
                  const { bg, text } = getPaymentStatusColor(payment.status);
                  
                  return (
                    <TableRow key={payment.id} className="hover:bg-neutral-50">
                      <TableCell className="text-sm text-neutral-500">
                        {formatDate(payment.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getProcessNumber(payment.hearingId)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {getProfessionalName(payment.professionalId)}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-500">
                        {getJurisdiction(payment.hearingId)}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell className="text-sm">
                        <span className={cn("px-2 py-1 text-xs font-medium rounded-full", bg, text)}>
                          {payment.status === "pending" ? "Pendente" : 
                           payment.status === "processing" ? "Em processamento" : 
                           "Pago"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-end pt-2">
        <Button variant="ghost" className="text-primary text-sm p-0 h-auto" onClick={onViewReportClick}>
          Ver relatório completo →
        </Button>
      </CardFooter>
    </Card>
  );
}
