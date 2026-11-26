import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { AssetSymbol } from "./types/onchain";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, compact = false): string {
  if (!Number.isFinite(value)) return "$0";
  if (compact) {
    const abs = Math.abs(value);
    if (abs >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (abs >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  }
  const decimals = Math.abs(value) < 500 ? 2 : 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCompactNumber(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) return "0";
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";
  if (abs >= 1e9) return `${sign}${(abs / 1e9).toFixed(decimals)}B`;
  if (abs >= 1e6) return `${sign}${(abs / 1e6).toFixed(decimals)}M`;
  if (abs >= 1e3) return `${sign}${(abs / 1e3).toFixed(decimals)}K`;
  return `${sign}${abs.toFixed(decimals)}`;
}

export function formatPct(value: number, showSign = true, decimals = 2): string {
  if (!Number.isFinite(value)) return "0.00%";
  const sign = showSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNativeCoin(value: number, asset: AssetSymbol): string {
  return `${formatCompactNumber(value, 2)} ${asset}`;
}

export function formatRatio(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return "0.00";
  return value.toFixed(decimals);
}
