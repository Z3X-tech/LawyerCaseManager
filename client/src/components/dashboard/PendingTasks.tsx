import { 
  Card, 
  CardContent, 
  CardHeader
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getTaskTypeIcon, getTaskTypeColor } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Task, Hearing, Professional } from "@shared/schema";

type PendingTasksProps = {
  tasks: Task[];
  isLoading: boolean;
  onViewAllClick: () => void;
};

export default function PendingTasks({ 
  tasks, 
  isLoading,
  onViewAllClick 
}: PendingTasksProps) {
  // Fetch hearings for task details
  const { data: hearings } = useQuery({
    queryKey: ["/api/hearings"],
  });
  
  // Fetch professionals for task details
  const { data: professionals } = useQuery({
    queryKey: ["/api/professionals"],
  });
  
  // Helper function to get related hearing
  const getRelatedHearing = (relatedId?: number) => {
    if (!relatedId || !hearings) return null;
    return hearings.find((h: Hearing) => h.id === relatedId);
  };
  
  // Helper function to get related professional
  const getRelatedProfessional = (relatedId?: number) => {
    if (!relatedId || !professionals) return null;
    return professionals.find((p: Professional) => p.id === relatedId);
  };
  
  // Filter to pending tasks only and limit to 4
  const pendingTasks = tasks
    .filter(task => task.status === "pending")
    .slice(0, 4);
  
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
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader className="flex items-center justify-between pb-2">
        <h3 className="font-semibold">Tarefas Pendentes</h3>
        <Button variant="ghost" className="text-primary text-sm p-0 h-auto" onClick={onViewAllClick}>
          Ver Todas
        </Button>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          {pendingTasks.length === 0 ? (
            <p className="text-center py-8 text-neutral-500">
              Não há tarefas pendentes.
            </p>
          ) : (
            pendingTasks.map((task) => {
              const taskType = task.type;
              const { bg, text } = getTaskTypeColor(taskType);
              
              return (
                <div key={task.id} className="p-3 border border-neutral-200 rounded-md hover:bg-neutral-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={cn("mr-3 p-2 rounded-md", bg)}>
                        <span className={text}>{getTaskTypeIcon(taskType)}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        <p className="text-neutral-500 text-xs mt-1">{task.description}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-neutral-700">
                      <span className="text-lg">⋯</span>
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
