import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

type MobileNavigationProps = {
  activePage: string;
  onNavigate: (page: string) => void;
};

export default function MobileNavigation({ activePage, onNavigate }: MobileNavigationProps) {
  const [location, setLocation] = useLocation();
  
  const handleNavigate = (path: string, label: string) => {
    setLocation(path);
    onNavigate(label);
  };
  
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex items-center justify-around z-10">
      <Link href="/dashboard">
        <a 
          onClick={() => onNavigate("Dashboard")}
          className={cn(
            "flex flex-col items-center py-2 px-3",
            activePage === "Dashboard" ? "text-primary" : "text-neutral-500"
          )}
        >
          <span className="text-xl">📊</span>
          <span className="text-xs mt-1">Dashboard</span>
        </a>
      </Link>
      
      <Link href="/calendar">
        <a 
          onClick={() => onNavigate("Calendário")}
          className={cn(
            "flex flex-col items-center py-2 px-3",
            activePage === "Calendário" ? "text-primary" : "text-neutral-500"
          )}
        >
          <span className="text-xl">📅</span>
          <span className="text-xs mt-1">Calendário</span>
        </a>
      </Link>
      
      <Link href="/hearings">
        <a 
          onClick={() => onNavigate("Audiências")}
          className={cn(
            "flex flex-col items-center py-2 px-3",
            activePage === "Audiências" ? "text-primary" : "text-neutral-500"
          )}
        >
          <span className="text-xl">📝</span>
          <span className="text-xs mt-1">Audiências</span>
        </a>
      </Link>
      
      <Link href="/professionals">
        <a 
          onClick={() => onNavigate("Profissionais")}
          className={cn(
            "flex flex-col items-center py-2 px-3",
            activePage === "Profissionais" ? "text-primary" : "text-neutral-500"
          )}
        >
          <span className="text-xl">👥</span>
          <span className="text-xs mt-1">Profissionais</span>
        </a>
      </Link>
      
      <div className="group relative">
        <button className="flex flex-col items-center py-2 px-3 text-neutral-500">
          <span className="text-xl">⋯</span>
          <span className="text-xs mt-1">Mais</span>
        </button>
        <div className="absolute bottom-16 right-0 bg-white border border-neutral-200 rounded-lg shadow-lg p-2 hidden group-hover:block">
          <Link href="/jurisdictions">
            <a onClick={() => onNavigate("Comarcas")} className="flex items-center p-2 text-sm hover:bg-neutral-100 rounded">
              <span className="mr-2">📍</span>
              Comarcas
            </a>
          </Link>
          <Link href="/payments">
            <a onClick={() => onNavigate("Pagamentos")} className="flex items-center p-2 text-sm hover:bg-neutral-100 rounded">
              <span className="mr-2">💰</span>
              Pagamentos
            </a>
          </Link>
          <Link href="/reports">
            <a onClick={() => onNavigate("Relatórios")} className="flex items-center p-2 text-sm hover:bg-neutral-100 rounded">
              <span className="mr-2">📊</span>
              Relatórios
            </a>
          </Link>
        </div>
      </div>
    </nav>
  );
}
