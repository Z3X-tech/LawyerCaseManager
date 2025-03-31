import { 
  Card, 
  CardContent, 
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatDate } from "@/lib/utils";
import { Hearing, Professional, Jurisdiction } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

type UpcomingHearingsProps = {
  hearings: Hearing[];
  isLoading: boolean;
  onViewAllClick: () => void;
};

export default function UpcomingHearings({ 
  hearings, 
  isLoading,
  onViewAllClick 
}: UpcomingHearingsProps) {
  // Fetch professionals for displaying names
  const { data: professionals } = useQuery({
    queryKey: ["/api/professionals"],
  });
  
  // Fetch jurisdictions for displaying locations
  const { data: jurisdictions } = useQuery({
    queryKey: ["/api/jurisdictions"],
  });
  
  // Helper function to get professional name
  const getProfessionalName = (id?: number) => {
    if (!id || !professionals) return "Não designado";
    const professional = professionals.find((p: Professional) => p.id === id);
    return professional ? professional.name : "Não designado";
  };
  
  // Helper function to get jurisdiction name
  const getJurisdictionLocation = (id: number) => {
    if (!jurisdictions) return "Carregando...";
    const jurisdiction = jurisdictions.find((j: Jurisdiction) => j.id === id);
    return jurisdiction ? `${jurisdiction.name} - ${jurisdiction.city}, ${jurisdiction.state}` : "Não encontrada";
  };
  
  // Helper function to get hearing date class
  const getHearingDateClass = (hearing: Hearing) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const hearingDate = hearing.date.toString().split('T')[0];
    
    if (hearingDate === today) {
      return "bg-primary/10 text-primary";
    } else if (hearingDate === tomorrowStr) {
      return "bg-warning/10 text-warning";
    } else {
      return "bg-neutral-200 text-neutral-700";
    }
  };
  
  // Helper function to format date label
  const getDateLabel = (hearing: Hearing) => {
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const hearingDate = hearing.date.toString().split('T')[0];
    
    if (hearingDate === today) {
      return `Hoje, ${hearing.time}`;
    } else if (hearingDate === tomorrowStr) {
      return `Amanhã, ${hearing.time}`;
    } else {
      return `${formatDate(hearing.date)}, ${hearing.time}`;
    }
  };
  
  // Sort hearings by date
  const sortedHearings = [...hearings].sort((a, b) => {
    const dateA = new Date(`${a.date.toString().split('T')[0]}T${a.time}`);
    const dateB = new Date(`${b.date.toString().split('T')[0]}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  }).slice(0, 3);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex justify-between pb-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-6 w-20" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <h3 className="font-semibold">Próximas Audiências</h3>
        <Button variant="ghost" className="text-primary text-sm p-0 h-auto" onClick={onViewAllClick}>
          Ver Todas
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {sortedHearings.length === 0 ? (
            <p className="text-center py-8 text-neutral-500">
              Não há audiências agendadas.
            </p>
          ) : (
            sortedHearings.map((hearing) => (
              <div key={hearing.id} className="p-3 border border-neutral-200 rounded-md hover:bg-neutral-50">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-sm">Processo nº {hearing.processNumber}</h4>
                    <p className="text-neutral-500 text-xs mt-1">
                      {getJurisdictionLocation(hearing.jurisdictionId)}
                    </p>
                  </div>
                  <div className={cn("text-xs font-medium py-1 px-2 rounded", getHearingDateClass(hearing))}>
                    {getDateLabel(hearing)}
                  </div>
                </div>
                <div className="flex items-center mt-3 text-xs text-neutral-500">
                  <div className="flex items-center mr-4">
                    <span className="mr-1">👤</span>
                    <span>{getProfessionalName(hearing.professionalId)}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="mr-1">⚖️</span>
                    <span>{hearing.area}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
