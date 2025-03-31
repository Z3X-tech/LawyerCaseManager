import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, BarChart2, PieChart, TrendingUp, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart as RePieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { formatCurrency, formatDate } from "@/lib/utils";

// Chart colors
const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export default function ReportsPage() {
  const [period, setPeriod] = useState("month");
  
  // Fetch hearings
  const { data: hearings, isLoading: isLoadingHearings } = useQuery({
    queryKey: ["/api/hearings"],
  });
  
  // Fetch payments
  const { data: payments, isLoading: isLoadingPayments } = useQuery({
    queryKey: ["/api/payments"],
  });
  
  // Fetch professionals
  const { data: professionals, isLoading: isLoadingProfessionals } = useQuery({
    queryKey: ["/api/professionals"],
  });
  
  // Fetch jurisdictions
  const { data: jurisdictions, isLoading: isLoadingJurisdictions } = useQuery({
    queryKey: ["/api/jurisdictions"],
  });
  
  // Fetch financial summary
  const { data: financialSummary, isLoading: isLoadingFinancialSummary } = useQuery({
    queryKey: ["/api/stats/financial", { period }],
  });
  
  // Prepare hearings data for charts
  const prepareHearingsChart = () => {
    if (!hearings) return [];
    
    // Group hearings by status
    const statusCount = hearings.reduce((acc, hearing) => {
      acc[hearing.status] = (acc[hearing.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Convert to chart data
    return Object.entries(statusCount).map(([status, count]) => ({
      name: status === "pending" ? "Pendente" : 
            status === "assigned" ? "Designada" : 
            status === "completed" ? "Concluída" : 
            status === "cancelled" ? "Cancelada" : status,
      value: count
    }));
  };
  
  // Prepare payments data for charts
  const preparePaymentsChart = () => {
    if (!payments) return [];
    
    // Group payments by status
    const statusSum = payments.reduce((acc, payment) => {
      acc[payment.status] = (acc[payment.status] || 0) + payment.amount;
      return acc;
    }, {} as Record<string, number>);
    
    // Convert to chart data
    return Object.entries(statusSum).map(([status, amount]) => ({
      name: status === "pending" ? "Pendente" : 
            status === "processing" ? "Em processamento" : 
            status === "paid" ? "Pago" : status,
      value: amount
    }));
  };
  
  // Prepare professional activity data
  const prepareProfessionalActivityData = () => {
    if (!hearings || !professionals) return [];
    
    // Count completed hearings per professional
    const professionalHearings = professionals.map(pro => {
      const completed = hearings.filter(h => 
        h.professionalId === pro.id && h.status === "completed"
      ).length;
      
      const assigned = hearings.filter(h => 
        h.professionalId === pro.id && h.status === "assigned"
      ).length;
      
      return {
        id: pro.id,
        name: pro.name,
        completed,
        assigned,
        total: completed + assigned
      };
    });
    
    // Sort by total descending
    return professionalHearings.sort((a, b) => b.total - a.total).slice(0, 10);
  };
  
  // Prepare recent payments data
  const prepareRecentPayments = () => {
    if (!payments || !professionals || !hearings) return [];
    
    // Get recent payments
    const sorted = [...payments].sort((a, b) => {
      const dateA = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
      const dateB = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
      return dateB - dateA;
    });
    
    return sorted.slice(0, 10).map(payment => {
      const professional = professionals.find(p => p.id === payment.professionalId);
      const hearing = hearings.find(h => h.id === payment.hearingId);
      
      return {
        ...payment,
        professionalName: professional ? professional.name : "Desconhecido",
        processNumber: hearing ? hearing.processNumber : "Desconhecido"
      };
    });
  };
  
  // Prepare jurisdiction activity data
  const prepareJurisdictionActivityData = () => {
    if (!hearings || !jurisdictions) return [];
    
    // Count hearings per jurisdiction
    const jurisdictionCounts = jurisdictions.map(jur => {
      const count = hearings.filter(h => h.jurisdictionId === jur.id).length;
      return {
        id: jur.id,
        name: jur.name,
        location: `${jur.city}, ${jur.state}`,
        count
      };
    });
    
    // Sort by count descending
    return jurisdictionCounts.sort((a, b) => b.count - a.count).slice(0, 5);
  };
  
  // Prepare data
  const hearingsChartData = prepareHearingsChart();
  const paymentsChartData = preparePaymentsChart();
  const professionalActivityData = prepareProfessionalActivityData();
  const recentPaymentsData = prepareRecentPayments();
  const jurisdictionActivityData = prepareJurisdictionActivityData();
  
  // Handle export to CSV
  const handleExport = () => {
    if (!hearings || !professionals || !jurisdictions || !payments) return;
    
    // Prepare data
    const rows = [
      ["Tipo", "Período", "Total"],
      ["Audiências Realizadas", period, hearings.filter(h => h.status === "completed").length.toString()],
      ["Audiências Pendentes", period, hearings.filter(h => h.status === "pending").length.toString()],
      ["Pagamentos Pendentes", period, payments.filter(p => p.status === "pending").length.toString()],
      ["Pagamentos Realizados", period, payments.filter(p => p.status === "paid").length.toString()],
      ["Total Pago", period, formatCurrency(payments.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0))]
    ];
    
    const csvContent = rows.map(row => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `relatorio_${period}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Render loading state
  if (isLoadingHearings || isLoadingPayments || isLoadingProfessionals || isLoadingJurisdictions || isLoadingFinancialSummary) {
    return (
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold mb-4 sm:mb-0">Relatórios</h1>
        
        <div className="flex space-x-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Últimos 7 dias</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
              <SelectItem value="year">Este ano</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            className="flex items-center"
            onClick={handleExport}
          >
            <Download className="mr-2 h-4 w-4" />
            <span>Exportar relatório</span>
          </Button>
        </div>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Total de Audiências</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hearings.length}
            </div>
            <p className="text-xs text-muted-foreground">
              +{hearings.filter(h => {
                const date = new Date(h.createdAt);
                const now = new Date();
                const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
                return diff <= 30;
              }).length} no último mês
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Audiências Concluídas</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hearings.filter(h => h.status === "completed").length}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((hearings.filter(h => h.status === "completed").length / hearings.length) * 100)}% do total
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Pagamentos Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(payments.reduce((sum, payment) => sum + payment.amount, 0))}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(financialSummary?.paid || 0)} pagos
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-sm font-medium">Profissionais Ativos</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {professionals.filter(p => p.active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              De um total de {professionals.length} cadastrados
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="professionals">Profissionais</TabsTrigger>
          <TabsTrigger value="jurisdictions">Comarcas</TabsTrigger>
          <TabsTrigger value="payments">Pagamentos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Status das Audiências</CardTitle>
                <CardDescription>
                  Distribuição de audiências por status.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={hearingsChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {hearingsChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} audiências`, 'Quantidade']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Pagamentos</CardTitle>
                <CardDescription>
                  Valores por status de pagamento.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={paymentsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${formatCurrency(value as number)}`, 'Valor']} />
                    <Legend />
                    <Bar dataKey="value" fill={CHART_COLORS[0]} name="Valor" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos Recentes</CardTitle>
              <CardDescription>
                Últimos 10 pagamentos registrados no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Processo</TableHead>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPaymentsData.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.processNumber}</TableCell>
                      <TableCell>{payment.professionalName}</TableCell>
                      <TableCell>{formatCurrency(payment.amount)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          payment.status === "pending" ? "bg-danger/10 text-danger" :
                          payment.status === "processing" ? "bg-warning/10 text-warning" :
                          "bg-success/10 text-success"
                        }`}>
                          {payment.status === "pending" ? "Pendente" :
                           payment.status === "processing" ? "Em processamento" :
                           "Pago"}
                        </span>
                      </TableCell>
                      <TableCell>{payment.paymentDate ? formatDate(payment.paymentDate) : "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="professionals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Atividade dos Profissionais</CardTitle>
              <CardDescription>
                Top 10 profissionais por audiências atribuídas e concluídas.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={professionalActivityData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis 
                    type="category" 
                    dataKey="name" 
                    tick={{ fontSize: 12 }}
                    width={100}
                  />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="completed" name="Concluídas" fill={CHART_COLORS[2]} />
                  <Bar dataKey="assigned" name="Designadas" fill={CHART_COLORS[0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Estatísticas por Tipo de Profissional</CardTitle>
              <CardDescription>
                Distribuição de advogados e pretores no sistema.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Tipos de Profissionais</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Advogados", value: professionals.filter(p => p.type === "lawyer").length },
                        { name: "Pretores", value: professionals.filter(p => p.type === "court_official").length }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      <Cell fill={CHART_COLORS[0]} />
                      <Cell fill={CHART_COLORS[1]} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">Especialização</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={
                        Object.entries(
                          professionals.reduce((acc, prof) => {
                            acc[prof.specialization] = (acc[prof.specialization] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ).map(([specialization, count]) => ({
                          name: specialization,
                          value: count
                        }))
                      }
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {Object.keys(
                        professionals.reduce((acc, prof) => {
                          acc[prof.specialization] = true;
                          return acc;
                        }, {} as Record<string, boolean>)
                      ).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="jurisdictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comarcas mais Ativas</CardTitle>
              <CardDescription>
                Top 5 comarcas com mais audiências.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={jurisdictionActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(label) => {
                      const item = jurisdictionActivityData.find(j => j.name === label);
                      return `${label} (${item?.location})`;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" name="Audiências" fill={CHART_COLORS[3]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Estado</CardTitle>
              <CardDescription>
                Número de comarcas por estado.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-2">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={
                      Object.entries(
                        jurisdictions.reduce((acc, jur) => {
                          acc[jur.state] = (acc[jur.state] || 0) + 1;
                          return acc;
                        }, {} as Record<string, number>)
                      ).map(([state, count]) => ({
                        name: state,
                        value: count
                      }))
                    }
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {Object.keys(
                      jurisdictions.reduce((acc, jur) => {
                        acc[jur.state] = true;
                        return acc;
                      }, {} as Record<string, boolean>)
                    ).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} comarcas`, 'Quantidade']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
              <CardDescription>
                Visão geral dos pagamentos do período.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Total</h3>
                  <p className="text-2xl font-bold">{formatCurrency(financialSummary?.total || 0)}</p>
                </div>
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Pendente</h3>
                  <p className="text-2xl font-bold text-danger">{formatCurrency(financialSummary?.pending || 0)}</p>
                </div>
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Pago</h3>
                  <p className="text-2xl font-bold text-success">{formatCurrency(financialSummary?.paid || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pagamentos por Profissional</CardTitle>
              <CardDescription>
                Total pago para cada profissional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Profissional</TableHead>
                    <TableHead>Audiências Concluídas</TableHead>
                    <TableHead>Total Pago</TableHead>
                    <TableHead>Pendente</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {professionals.map((professional) => {
                    const completedHearings = hearings.filter(
                      h => h.professionalId === professional.id && h.status === "completed"
                    ).length;
                    
                    const totalPaid = payments
                      .filter(p => p.professionalId === professional.id && p.status === "paid")
                      .reduce((sum, p) => sum + p.amount, 0);
                    
                    const totalPending = payments
                      .filter(p => p.professionalId === professional.id && p.status === "pending")
                      .reduce((sum, p) => sum + p.amount, 0);
                    
                    return (
                      <TableRow key={professional.id}>
                        <TableCell className="font-medium">{professional.name}</TableCell>
                        <TableCell>{completedHearings}</TableCell>
                        <TableCell>{formatCurrency(totalPaid)}</TableCell>
                        <TableCell>{formatCurrency(totalPending)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
