"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface TabOption<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  count?: number;
}

interface TabsProps<T extends string> {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  className?: string;
}

export function Tabs<T extends string>({
  options,
  value,
  onChange,
  size = "md",
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex flex-wrap items-center gap-1 rounded-lg border border-terminal-border bg-terminal-bg/90 p-1",
        className
      )}
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md font-medium transition-all",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-xs sm:text-sm",
              active
                ? "bg-sky-500/20 text-sky-300 shadow-[inset_0_0_0_1px_rgba(56,189,248,0.4)]"
                : "text-slate-400 hover:bg-terminal-hover hover:text-slate-200"
            )}
          >
            {opt.icon}
            <span>{opt.label}</span>
            {typeof opt.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-mono tabular-nums",
                  active
                    ? "bg-sky-400/25 text-sky-200"
                    : "bg-slate-800 text-slate-400"
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
