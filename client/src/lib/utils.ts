import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDate(date: string | Date): string {
  if (!date) return "";
  return format(new Date(date), "dd/MM/yyyy", { locale: ptBR });
}

export function formatDateTime(date: string | Date): string {
  if (!date) return "";
  return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR });
}

export function getHearingStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "pending":
      return { bg: "bg-warning/10", text: "text-warning" };
    case "assigned":
      return { bg: "bg-primary/10", text: "text-primary" };
    case "completed":
      return { bg: "bg-success/10", text: "text-success" };
    case "cancelled":
      return { bg: "bg-danger/10", text: "text-danger" };
    default:
      return { bg: "bg-neutral-200", text: "text-neutral-700" };
  }
}

export function getPaymentStatusColor(status: string): { bg: string; text: string } {
  switch (status) {
    case "pending":
      return { bg: "bg-danger/10", text: "text-danger" };
    case "processing":
      return { bg: "bg-warning/10", text: "text-warning" };
    case "paid":
      return { bg: "bg-success/10", text: "text-success" };
    default:
      return { bg: "bg-neutral-200", text: "text-neutral-700" };
  }
}

export function getTaskTypeIcon(type: string): string {
  switch (type) {
    case "upload_minutes":
      return "📤";
    case "assign_professional":
      return "🔍";
    case "payment":
      return "💰";
    default:
      return "📝";
  }
}

export function getTaskTypeColor(type: string): { bg: string; text: string } {
  switch (type) {
    case "upload_minutes":
      return { bg: "bg-danger/10", text: "text-danger" };
    case "assign_professional":
      return { bg: "bg-warning/10", text: "text-warning" };
    case "payment":
      return { bg: "bg-accent/10", text: "text-accent" };
    default:
      return { bg: "bg-success/10", text: "text-success" };
  }
}
