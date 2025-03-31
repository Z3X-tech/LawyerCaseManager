import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Calendar as BigCalendar, dateFnsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { format, parse, startOfWeek, getDay, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Hearing } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import HearingForm from "@/components/hearings/HearingForm";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

// Setup localization for react-big-calendar
const locales = {
  "pt-BR": ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month");
  const [isAddHearingDialogOpen, setIsAddHearingDialogOpen] = useState(false);
  const [selectedHearing, setSelectedHearing] = useState<Hearing | null>(null);
  const [isHearingDetailsOpen, setIsHearingDetailsOpen] = useState(false);
  const { toast } = useToast();
  
  // Fetch all hearings
  const { data: hearings, isLoading } = useQuery({
    queryKey: ["/api/hearings"],
  });
  
  // Fetch professionals for dropdown
  const { data: professionals } = useQuery({
    queryKey: ["/api/professionals"],
  });
  
  // Fetch jurisdictions for dropdown
  const { data: jurisdictions } = useQuery({
    queryKey: ["/api/jurisdictions"],
  });
  
  // Format hearings for calendar view
  const calendarEvents = hearings?.map((hearing: Hearing) => {
    const hearingDate = new Date(`${hearing.date.toString().split('T')[0]}T${hearing.time}`);
    const endTime = new Date(hearingDate);
    endTime.setHours(endTime.getHours() + 1); // Assuming 1-hour hearings
    
    // Get color based on status
    let bgColor;
    switch (hearing.status) {
      case "pending":
        bgColor = "#f59e0b";
        break;
      case "assigned":
        bgColor = "#2563eb";
        break;
      case "completed":
        bgColor = "#22c55e";
        break;
      case "cancelled":
        bgColor = "#ef4444";
        break;
      default:
        bgColor = "#4b5563";
    }
    
    return {
      id: hearing.id,
      title: `${hearing.time} - ${hearing.processNumber}`,
      start: hearingDate,
      end: endTime,
      allDay: false,
      resource: hearing,
      backgroundColor: bgColor
    };
  }) || [];
  
  // Handle event click
  const handleEventClick = (event: any) => {
    setSelectedHearing(event.resource);
    setIsHearingDetailsOpen(true);
  };
  
  // Navigate to previous month
  const navigateToPrev = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };
  
  // Navigate to next month
  const navigateToNext = () => {
    const newDate = new Date(currentDate);
    if (view === "month") {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };
  
  // Navigate to today
  const navigateToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Custom day renderer
  const customDayPropGetter = (date: Date) => {
    if (isToday(date)) {
      return {
        className: 'bg-primary/5',
      };
    }
    return {};
  };
  
  // Custom event renderer
  const eventStyleGetter = (event: any) => {
    return {
      style: {
        backgroundColor: event.backgroundColor,
        borderRadius: '4px',
        opacity: 1,
        color: '#fff',
        border: '0',
        display: 'block',
        padding: '2px 4px',
        fontSize: '12px'
      }
    };
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-8 w-40" />
          <div className="flex space-x-2">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }
  
  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold mb-4 sm:mb-0">Calendário de Audiências</h1>
        
        <div className="flex space-x-2">
          <div className="flex">
            <Button variant="outline" size="sm" onClick={navigateToPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToToday}>
              {format(currentDate, "MMMM yyyy", { locale: ptBR })}
            </Button>
            <Button variant="outline" size="sm" onClick={navigateToNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex">
            <Button 
              variant={view === "month" ? "default" : "outline"} 
              size="sm" 
              className="rounded-r-none"
              onClick={() => setView("month")}
            >
              Mês
            </Button>
            <Button 
              variant={view === "week" ? "default" : "outline"} 
              size="sm" 
              className="rounded-none"
              onClick={() => setView("week")}
            >
              Semana
            </Button>
            <Button 
              variant={view === "day" ? "default" : "outline"} 
              size="sm" 
              className="rounded-l-none"
              onClick={() => setView("day")}
            >
              Dia
            </Button>
          </div>
          
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
                  // Refresh hearings data
                  queryClient.invalidateQueries({ queryKey: ["/api/hearings"] });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {/* Calendar */}
      <Card>
        <CardContent className="p-0 overflow-hidden">
          <BigCalendar
            localizer={localizer}
            events={calendarEvents}
            startAccessor="start"
            endAccessor="end"
            style={{ height: 600 }}
            views={["month", "week", "day"]}
            view={view as any}
            date={currentDate}
            onNavigate={setCurrentDate}
            onView={(view) => setView(view)}
            dayPropGetter={customDayPropGetter}
            eventPropGetter={eventStyleGetter}
            onSelectEvent={handleEventClick}
            culture="pt-BR"
            messages={{
              today: "Hoje",
              previous: "Anterior",
              next: "Próximo",
              month: "Mês",
              week: "Semana",
              day: "Dia",
              agenda: "Agenda",
              date: "Data",
              time: "Hora",
              event: "Evento",
              noEventsInRange: "Não há audiências neste período."
            }}
          />
        </CardContent>
      </Card>
      
      {/* Hearing Details Dialog */}
      {selectedHearing && (
        <Dialog open={isHearingDetailsOpen} onOpenChange={setIsHearingDetailsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Detalhes da Audiência</DialogTitle>
              <DialogDescription>
                Processo nº {selectedHearing.processNumber}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Data:</span>
                <span className="col-span-3">{formatDate(selectedHearing.date)}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Horário:</span>
                <span className="col-span-3">{selectedHearing.time}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Comarca:</span>
                <span className="col-span-3">
                  {jurisdictions?.find(j => j.id === selectedHearing.jurisdictionId)?.name || "Não informado"}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Tipo:</span>
                <span className="col-span-3">{selectedHearing.type}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Área:</span>
                <span className="col-span-3">{selectedHearing.area}</span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Profissional:</span>
                <span className="col-span-3">
                  {professionals?.find(p => p.id === selectedHearing.professionalId)?.name || "Não designado"}
                </span>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <span className="font-medium">Status:</span>
                <span className={cn(
                  "col-span-3 px-2 py-1 text-xs font-medium rounded-full inline-block",
                  selectedHearing.status === "pending" && "bg-warning/10 text-warning",
                  selectedHearing.status === "assigned" && "bg-primary/10 text-primary",
                  selectedHearing.status === "completed" && "bg-success/10 text-success",
                  selectedHearing.status === "cancelled" && "bg-danger/10 text-danger"
                )}>
                  {selectedHearing.status === "pending" && "Pendente"}
                  {selectedHearing.status === "assigned" && "Designada"}
                  {selectedHearing.status === "completed" && "Concluída"}
                  {selectedHearing.status === "cancelled" && "Cancelada"}
                </span>
              </div>
              {selectedHearing.notes && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <span className="font-medium">Observações:</span>
                  <span className="col-span-3">{selectedHearing.notes}</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setIsHearingDetailsOpen(false)}>
                Fechar
              </Button>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => {
                  setIsHearingDetailsOpen(false);
                  // Open the edit dialog...
                }}>
                  Editar
                </Button>
                {selectedHearing.status === "completed" && !selectedHearing.minutesUploaded && (
                  <Button onClick={() => {
                    setIsHearingDetailsOpen(false);
                    // Open the upload minutes dialog...
                  }}>
                    Anexar Ata
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
