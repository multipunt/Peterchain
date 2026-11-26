"use client";

import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export function Switch({ checked, onChange, label, disabled = false }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border transition-colors",
        checked
          ? "border-emerald-400/50 bg-emerald-500/35"
          : "border-terminal-border bg-terminal-bg",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full transition-transform",
          checked
            ? "translate-x-4 bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.7)]"
            : "translate-x-0.5 bg-slate-500"
        )}
      />
    </button>
  );
}
