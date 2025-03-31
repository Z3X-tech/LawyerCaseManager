import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Calendar from "@/pages/calendar";
import Hearings from "@/pages/hearings";
import Professionals from "@/pages/professionals";
import Jurisdictions from "@/pages/jurisdictions";
import Payments from "@/pages/payments";
import Reports from "@/pages/reports";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MobileNavigation from "@/components/layout/MobileNavigation";
import { useState } from "react";

function Router() {
  const [currentPage, setCurrentPage] = useState("Dashboard");
  
  return (
    <div className="bg-neutral-100 text-neutral-800 flex h-screen overflow-hidden">
      <Sidebar activePage={currentPage} onNavigate={setCurrentPage} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentPage={currentPage} />
        
        <main className="flex-1 overflow-y-auto p-4 bg-neutral-50">
          <Switch>
            <Route path="/" component={Dashboard} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/calendar" component={Calendar} />
            <Route path="/hearings" component={Hearings} />
            <Route path="/professionals" component={Professionals} />
            <Route path="/jurisdictions" component={Jurisdictions} />
            <Route path="/payments" component={Payments} />
            <Route path="/reports" component={Reports} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      
      <MobileNavigation activePage={currentPage} onNavigate={setCurrentPage} />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
