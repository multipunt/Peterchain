import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "neutral"
  | "bull"
  | "bear"
  | "warn"
  | "info"
  | "cyan"
  | "accent";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-slate-800/80 text-slate-300 border-slate-700/80",
  bull: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  bear: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  warn: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  info: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  cyan: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30",
  accent: "bg-violet-500/15 text-violet-300 border-violet-500/30",
};

const DOT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-slate-400",
  bull: "bg-emerald-400",
  bear: "bg-rose-400",
  warn: "bg-amber-400",
  info: "bg-sky-400",
  cyan: "bg-cyan-400",
  accent: "bg-violet-400",
};

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
}

export function Badge({
  children,
  variant = "neutral",
  pulse = false,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-2 w-2">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              DOT_CLASSES[variant]
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              DOT_CLASSES[variant]
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
