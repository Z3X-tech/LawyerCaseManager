import { useState } from "react";
import { Bell } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type HeaderProps = {
  currentPage: string;
};

export default function Header({ currentPage }: HeaderProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <header className="bg-white border-b border-neutral-200 flex items-center justify-between p-4">
      <div className="flex items-center">
        <button 
          className="md:hidden mr-4 text-neutral-500"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <span className="text-xl">☰</span>
        </button>
        <h2 className="text-lg font-semibold">{currentPage}</h2>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-neutral-500 hover:text-neutral-800 relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center bg-red-500">3</Badge>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificações</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">Nova audiência designada</span>
                  <span className="text-sm text-neutral-500">Audiência para o processo 2023.0123.4567 agendada para 14/06/2023.</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">Ata pendente</span>
                  <span className="text-sm text-neutral-500">A ata da audiência do processo 2023.0001.2345 ainda não foi enviada.</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <div className="flex flex-col space-y-1">
                  <span className="font-medium">Pagamento confirmado</span>
                  <span className="text-sm text-neutral-500">O pagamento para Dr. Rafael Almeida foi confirmado.</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarFallback>AS</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:inline">Amanda Silva</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem className="cursor-pointer">Perfil</DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">Configurações</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">Sair</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
