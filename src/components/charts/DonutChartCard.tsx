import React, { useState } from "react";
import { LucideIcon } from "lucide-react";

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
  unit?: string;
  userKey?: string;
}

export interface DonutChartCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon | React.ComponentType<{ className?: string }>;
  slices: DonutSlice[];
  centerValue: string | number;
  centerLabel: string;
  unitLabel?: string;
  onSliceClick?: (slice: DonutSlice) => void;
  activeSliceKey?: string;
}

export const DonutChartCard: React.FC<DonutChartCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  slices,
  centerValue,
  centerLabel,
  unitLabel = "units",
  onSliceClick,
  activeSliceKey,
}) => {
  const [hovered, setHovered] = useState<{
    label: string;
    value: number;
    color: string;
    percent: number;
    unit?: string;
  } | null>(null);

  const total = slices.reduce((acc, s) => acc + s.value, 0) || 1;
  const radius = 54;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;
  const renderedSlices = slices.map((slice) => {
    const percent = slice.value / total;
    const strokeDash = percent * circumference;
    const strokeOffset = -cumulativePercent * circumference;
    cumulativePercent += percent;
    return {
      ...slice,
      percent: Math.round(percent * 100),
      strokeDash,
      strokeOffset,
    };
  });

  return (
    <div className="bg-[#070D1A]/90 backdrop-blur-2xl border border-cyan-500/25 rounded-3xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] hover:border-cyan-400/50 hover:shadow-[0_12px_36px_rgba(0,242,254,0.18)] transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-cyan-500/15">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300 shadow-[0_0_12px_rgba(0,242,254,0.3)]">
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white tracking-tight">
              {title}
            </h3>
            <p className="text-[10px] text-slate-400">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-5 my-3">
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-36 h-36" viewBox="0 0 160 160">
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="#131C2E"
              strokeWidth="15"
            />

            {renderedSlices.map((slice) => {
              const isSelected =
                activeSliceKey &&
                (slice.userKey === activeSliceKey ||
                  slice.label === activeSliceKey);
              return (
                <circle
                  key={slice.label}
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isSelected ? 18 : 15}
                  strokeDasharray={`${slice.strokeDash} ${circumference - slice.strokeDash}`}
                  strokeDashoffset={slice.strokeOffset}
                  transform="rotate(-90 80 80)"
                  strokeLinecap="round"
                  className={`transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? "opacity-100 filter drop-shadow(0 2px 5px rgba(0,0,0,0.25))"
                      : "hover:opacity-80"
                  }`}
                  onClick={() => onSliceClick?.(slice)}
                  onMouseEnter={() => setHovered(slice)}
                  onMouseLeave={() => setHovered(null)}
                />
              );
            })}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2">
            <span className="text-lg font-bold font-mono text-white leading-tight">
              {hovered ? `${hovered.value}` : centerValue}
            </span>
            <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 truncate max-w-[80px]">
              {hovered ? `${hovered.percent}%` : centerLabel}
            </span>
          </div>
        </div>

        <div className="space-y-1.5 flex-1 w-full min-w-0">
          {renderedSlices.map((s) => {
            const isSelected =
              activeSliceKey &&
              (s.userKey === activeSliceKey || s.label === activeSliceKey);
            return (
              <div
                key={s.label}
                onClick={() => onSliceClick?.(s)}
                onMouseEnter={() => setHovered(s)}
                onMouseLeave={() => setHovered(null)}
                className={`flex items-center justify-between text-xs p-1.5 rounded-xl cursor-pointer transition-all ${
                  isSelected
                    ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold shadow-2xs"
                    : hovered?.label === s.label
                      ? "bg-white/10 scale-[1.02]"
                      : "hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-2 truncate min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-xs"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="truncate font-medium text-slate-200 text-[11px]">
                    {s.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 font-mono text-[11px]">
                  <span className="font-bold text-white">
                    {s.value} {s.unit || unitLabel}
                  </span>
                  <span className="text-[10px] text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-1.5 py-0.5 rounded-full">
                    {s.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
