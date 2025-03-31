import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type SidebarProps = {
  activePage: string;
  onNavigate: (page: string) => void;
};

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
  const [location, setLocation] = useLocation();
  
  const handleNavigate = (path: string, label: string) => {
    setLocation(path);
    onNavigate(label);
  };
  
  return (
    <aside className="bg-white w-64 border-r border-neutral-200 h-full hidden md:block overflow-y-auto">
      <div className="p-4 border-b border-neutral-200">
        <h1 className="text-xl font-semibold text-primary flex items-center">
          <span className="mr-2">⚖️</span>
          JurisCRM
        </h1>
      </div>

      <div className="py-4">
        <p className="px-4 text-xs font-medium text-neutral-500 uppercase mb-2">Menu Principal</p>
        
        <Link href="/dashboard">
          <a 
            onClick={() => onNavigate("Dashboard")}
            className={cn(
              "sidebar-link flex items-center px-4 py-3 text-sm",
              activePage === "Dashboard" && "active bg-primary/10 text-primary border-l-3 border-primary"
            )}
          >
            <span className="mr-3 text-lg">📊</span>
            Dashboard
          </a>
        </Link>
        
        <Link href="/calendar">
          <a 
            onClick={() => onNavigate("Calendário")}
            className={cn(
              "sidebar-link flex items-center px-4 py-3 text-sm",
              activePage === "Calendário" && "active bg-primary/10 text-primary border-l-3 border-primary"
            )}
          >
            <span className="mr-3 text-lg">📅</span>
            Calendário
          </a>
        </Link>
        
        <Link href="/hearings">
          <a 
            onClick={() => onNavigate("Audiências")}
            className={cn(
              "sidebar-link flex items-center px-4 py-3 text-sm",
              activePage === "Audiências" && "active bg-primary/10 text-primary border-l-3 border-primary"
            )}
          >
            <span className="mr-3 text-lg">📝</span>
            Audiências
          </a>
        </Link>
        
        <Link href="/professionals">
          <a 
            onClick={() => onNavigate("Profissionais")}
            className={cn(
              "sidebar-link flex items-center px-4 py-3 text-sm",
              activePage === "Profissionais" && "active bg-primary/10 text-primary border-l-3 border-primary"
            )}
          >
            <span className="mr-3 text-lg">👥</span>
            Profissionais
          </a>
        </Link>
        
        <Link href="/jurisdictions">
          <a 
            onClick={() => onNavigate("Comarcas")}
            className={cn(
              "sidebar-link flex items-center px-4 py-3 text-sm",
              activePage === "Comarcas" && "active bg-primary/10 text-primary border-l-3 border-primary"
            )}
          >
            <span className="mr-3 text-lg">📍</span>
            Comarcas
          </a>
        </Link>
        
        <Link href="/payments">
          <a 
            onClick={() => onNavigate("Pagamentos")}
            className={cn(
              "sidebar-link flex items-center px-4 py-3 text-sm",
              activePage === "Pagamentos" && "active bg-primary/10 text-primary border-l-3 border-primary"
            )}
          >
            <span className="mr-3 text-lg">💰</span>
            Pagamentos
          </a>
        </Link>
        
        <Link href="/reports">
          <a 
            onClick={() => onNavigate("Relatórios")}
            className={cn(
              "sidebar-link flex items-center px-4 py-3 text-sm",
              activePage === "Relatórios" && "active bg-primary/10 text-primary border-l-3 border-primary"
            )}
          >
            <span className="mr-3 text-lg">📊</span>
            Relatórios
          </a>
        </Link>
        
        <p className="px-4 text-xs font-medium text-neutral-500 uppercase mb-2 mt-6">Configurações</p>
        
        <a href="#" className="sidebar-link flex items-center px-4 py-3 text-sm">
          <span className="mr-3 text-lg">⚙️</span>
          Configurações
        </a>
        
        <a href="#" className="sidebar-link flex items-center px-4 py-3 text-sm">
          <span className="mr-3 text-lg">👤</span>
          Perfil
        </a>
      </div>
    </aside>
  );
}
