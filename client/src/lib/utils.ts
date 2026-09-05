import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string, lead: number = 6, tail: number = 4): string {
  if (!address) return "";
  if (address.length <= lead + tail) return address;
  return `${address.substring(0, lead)}...${address.substring(address.length - tail)}`;
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(amount);
}

export function getRiskColor(risk: string | number): string {
  if (typeof risk === "number") {
    if (risk >= 0.8) return "text-rose-500 bg-rose-500/10 border-rose-500/20";
    if (risk >= 0.5) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
  }
  const r = risk?.toUpperCase() || "LOW";
  switch (r) {
    case "CRITICAL":
      return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    case "HIGH":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "MEDIUM":
      return "text-blue-400 bg-blue-500/10 border-blue-500/30";
    case "LOW":
    case "BENIGN":
    default:
      return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
  }
}
