"use client";

const PHASE_CONFIG: Record<string, { emoji: string; bg: string; text: string }> = {
  RECON:    { emoji: "🔍", bg: "bg-yellow-900/50", text: "text-yellow-300" },
  SCAN:     { emoji: "📡", bg: "bg-yellow-900/50", text: "text-yellow-300" },
  EXPLOIT:  { emoji: "💥", bg: "bg-red-900/50",    text: "text-red-300" },
  ESCALATE: { emoji: "⬆️", bg: "bg-orange-900/50", text: "text-orange-300" },
  PERSIST:  { emoji: "🪝", bg: "bg-rose-900/50",   text: "text-rose-300" },
  EXFIL:    { emoji: "📤", bg: "bg-pink-900/50",   text: "text-pink-300" },
  DETECT:   { emoji: "🛡️", bg: "bg-blue-900/50",   text: "text-blue-300" },
  HARDEN:   { emoji: "🔒", bg: "bg-cyan-900/50",   text: "text-cyan-300" },
  RESPOND:  { emoji: "🚨", bg: "bg-indigo-900/50", text: "text-indigo-300" },
  CONTAIN:  { emoji: "🔐", bg: "bg-violet-900/50", text: "text-violet-300" },
  MONITOR:  { emoji: "👁️", bg: "bg-teal-900/50",   text: "text-teal-300" },
  ANALYZE:  { emoji: "📊", bg: "bg-emerald-900/50",text: "text-emerald-300" },
  SYSTEM:   { emoji: "⚙️", bg: "bg-gray-800/50",   text: "text-gray-300" },
};

interface PhaseIconProps {
  phase: string;
  showLabel?: boolean;
}

export function PhaseIcon({ phase, showLabel = true }: PhaseIconProps) {
  const config = PHASE_CONFIG[phase] || PHASE_CONFIG.SYSTEM;

  return (
    <span className={`phase-badge inline-flex items-center gap-1 ${config.bg} ${config.text}`}>
      <span className="text-[0.7rem]">{config.emoji}</span>
      {showLabel && <span>{phase}</span>}
    </span>
  );
}
