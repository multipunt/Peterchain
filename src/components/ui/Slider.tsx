"use client";

import { cn } from "@/lib/utils";

interface SliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  onChange: (value: number) => void;
  disabled?: boolean;
  className?: string;
}

export function Slider({
  label,
  description,
  value,
  min,
  max,
  step,
  unit = "",
  onChange,
  disabled = false,
  className,
}: SliderProps) {
  return (
    <div className={cn("space-y-2", disabled && "opacity-50", className)}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <label className="text-xs font-medium text-slate-200">{label}</label>
          {description && (
            <p className="text-[11px] text-slate-400">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              if (!Number.isNaN(parsed)) {
                onChange(Math.min(max, Math.max(min, parsed)));
              }
            }}
            className="w-24 rounded-md border border-terminal-border bg-terminal-bg px-2 py-1 text-right font-mono text-xs text-sky-300 tabular-nums focus:border-sky-500 focus:outline-none"
          />
          {unit && (
            <span className="min-w-[30px] font-mono text-[11px] text-slate-400">
              {unit}
            </span>
          )}
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="terminal-slider w-full"
      />

      <div className="flex justify-between font-mono text-[10px] text-slate-500 tabular-nums">
        <span>
          {min}
          {unit}
        </span>
        <span>
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}
