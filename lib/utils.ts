import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(n: number): string {
  return 'Rs ' + Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatNumber(n: number): string {
  return Number(n || 0).toLocaleString('en-PK', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDate(d: string): string {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function generateInvoiceNo(): string {
  return 'INV-' + Date.now().toString().slice(-6);
}

export function generateQuoteNo(): string {
  return 'QT-' + Date.now().toString().slice(-5);
}

export function generatePONo(): string {
  return 'PO-' + Date.now().toString().slice(-5);
}
