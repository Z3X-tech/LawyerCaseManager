import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import UpcomingHearings from "@/components/dashboard/UpcomingHearings";
import PendingTasks from "@/components/dashboard/PendingTasks";
import FinancialSummary from "@/components/dashboard/FinancialSummary";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import HearingForm from "@/components/hearings/HearingForm";

export default function Dashboard() {
  const [location, setLocation] = useLocation();
  const [isAddHearingDialogOpen, setIsAddHearingDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch statistics
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["/api/stats/hearings"],
  });
  
  // Fetch upcoming hearings
  const { data: upcomingHearings, isLoading: isLoadingHearings } = useQuery({
    queryKey: ["/api/hearings/upcoming"],
  });
  
  // Fetch pending tasks
  const { data: pendingTasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ["/api/tasks/status/pending"],
  });
  
  const today = new Date();
  const formattedDate = format(today, "dd/MM/yyyy", { locale: ptBR });
  
  return (
    <div>
      {/* Dashboard Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold mb-4 sm:mb-0">Dashboard</h1>
        
        <div className="flex space-x-2">
          <Button variant="outline" className="flex items-center">
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span>Hoje: {formattedDate}</span>
          </Button>
          
          <Dialog open={isAddHearingDialogOpen} onOpenChange={setIsAddHearingDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center">
                <span className="mr-2">+</span>
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
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard 
          title="Audiências Hoje"
          value={isLoadingStats ? "--" : stats?.todayCount.toString()}
          icon="📅"
          iconBg="bg-primary/10"
          iconColor="text-primary"
          trend={8}
          trendText="vs. semana anterior"
        />
        
        <StatsCard 
          title="Aguardando Advogados"
          value={isLoadingStats ? "--" : stats?.pendingAssignment.toString()}
          icon="⏱️"
          iconBg="bg-warning/10"
          iconColor="text-warning"
          trend={12}
          trendText="vs. semana anterior"
          trendDirection="up"
          trendColor="text-danger"
        />
        
        <StatsCard 
          title="Atas Pendentes"
          value={isLoadingStats ? "--" : stats?.pendingMinutes.toString()}
          icon="📄"
          iconBg="bg-danger/10"
          iconColor="text-danger"
          trend={3}
          trendText="vs. semana anterior"
          trendDirection="up"
          trendColor="text-danger"
        />
        
        <StatsCard 
          title="Pagamentos Pendentes"
          value={isLoadingStats ? "--" : `R$ 12.450,00`}
          icon="💰"
          iconBg="bg-accent/10"
          iconColor="text-accent"
          trend={5}
          trendText="vs. semana anterior"
          trendDirection="down"
          trendColor="text-success"
        />
      </div>
      
      {/* Recent and Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <UpcomingHearings 
          hearings={upcomingHearings || []}
          isLoading={isLoadingHearings}
          onViewAllClick={() => setLocation("/hearings")}
        />
        
        <PendingTasks 
          tasks={pendingTasks || []}
          isLoading={isLoadingTasks}
          onViewAllClick={() => setLocation("/tasks")}
        />
      </div>
      
      {/* Financial Summary */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        <FinancialSummary 
          onViewReportClick={() => setLocation("/payments")}
        />
      </div>
    </div>
  );
}
