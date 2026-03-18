"use client";

import type { BattleReport } from "@/types";

interface ScoreChartProps {
  report: BattleReport;
}

interface StatPair {
  label: string;
  red: number;
  blue: number;
  maxVal: number;
}

export function ScoreChart({ report }: ScoreChartProps) {
  const { events, timeline } = report;

  // Calculate stats from events
  const redEvents = events.filter((e) => e.team === "red");
  const blueEvents = events.filter((e) => e.team === "blue");

  const redLanded = redEvents.filter((e) => e.success).length;
  const redBlocked = redEvents.filter((e) => !e.success).length;
  const blueDetected = blueEvents.filter((e) => e.phase === "DETECT" && e.success).length;
  const blueMissed = blueEvents.filter((e) => e.phase === "DETECT" && !e.success).length;
  const blueHardened = blueEvents.filter((e) => e.phase === "HARDEN" && e.success).length;

  const stats: StatPair[] = [
    { label: "Successful Actions", red: redLanded, blue: blueEvents.filter((e) => e.success).length, maxVal: Math.max(redLanded, blueEvents.filter((e) => e.success).length, 1) },
    { label: "Attacks Landed", red: redLanded, blue: 0, maxVal: Math.max(redLanded, 1) },
    { label: "Attacks Blocked", red: redBlocked, blue: 0, maxVal: Math.max(redBlocked, 1) },
    { label: "Detections Correct", red: 0, blue: blueDetected, maxVal: Math.max(blueDetected, 1) },
    { label: "Detections Missed", red: 0, blue: blueMissed, maxVal: Math.max(blueMissed, 1) },
    { label: "Hardening Actions", red: 0, blue: blueHardened, maxVal: Math.max(blueHardened, 1) },
  ];

  const overallMax = Math.max(...stats.map((s) => Math.max(s.red, s.blue)), 1);

  return (
    <div className="space-y-6">
      {/* Horizontal bar chart */}
      <div className="space-y-4">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-gray-400">{stat.label}</span>
              <div className="flex gap-4 text-xs text-mono">
                {stat.red > 0 && <span className="text-red-400">{stat.red}</span>}
                {stat.blue > 0 && <span className="text-blue-400">{stat.blue}</span>}
              </div>
            </div>
            <div className="flex gap-1 h-5">
              {/* Red bar */}
              <div className="flex-1 flex justify-end">
                <div
                  className="h-full rounded-l-sm bg-gradient-to-l from-red-500 to-red-700 transition-all duration-700"
                  style={{ width: `${(stat.red / overallMax) * 100}%`, minWidth: stat.red > 0 ? "4px" : "0" }}
                />
              </div>
              {/* Divider */}
              <div className="w-px bg-gray-700" />
              {/* Blue bar */}
              <div className="flex-1">
                <div
                  className="h-full rounded-r-sm bg-gradient-to-r from-blue-500 to-blue-700 transition-all duration-700"
                  style={{ width: `${(stat.blue / overallMax) * 100}%`, minWidth: stat.blue > 0 ? "4px" : "0" }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Score line chart (pure SVG) */}
      {timeline.length > 1 && (
        <div className="mt-6">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Score Progression</div>
          <ScoreLineChart timeline={timeline} />
        </div>
      )}
    </div>
  );
}

function ScoreLineChart({ timeline }: { timeline: BattleReport["timeline"] }) {
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };

  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const allScores = timeline.flatMap((t) => [t.cumulativeRedScore, t.cumulativeBlueScore]);
  const minScore = Math.min(0, ...allScores);
  const maxScore = Math.max(10, ...allScores);
  const scoreRange = maxScore - minScore || 1;

  const xScale = (i: number) => padding.left + (i / Math.max(timeline.length - 1, 1)) * innerW;
  const yScale = (val: number) => padding.top + innerH - ((val - minScore) / scoreRange) * innerH;

  const redPath = timeline.map((t, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(t.cumulativeRedScore)}`).join(" ");
  const bluePath = timeline.map((t, i) => `${i === 0 ? "M" : "L"} ${xScale(i)} ${yScale(t.cumulativeBlueScore)}`).join(" ");

  // Zero line
  const zeroY = yScale(0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <line
          key={frac}
          x1={padding.left}
          y1={padding.top + innerH * frac}
          x2={width - padding.right}
          y2={padding.top + innerH * frac}
          stroke="rgba(75, 85, 99, 0.2)"
          strokeDasharray="4 4"
        />
      ))}

      {/* Zero line */}
      {minScore < 0 && (
        <line
          x1={padding.left}
          y1={zeroY}
          x2={width - padding.right}
          y2={zeroY}
          stroke="rgba(107, 114, 128, 0.4)"
          strokeWidth={1}
        />
      )}

      {/* Red line */}
      <path d={redPath} fill="none" stroke="#ef4444" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Red glow */}
      <path d={redPath} fill="none" stroke="#ef4444" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.15} />

      {/* Blue line */}
      <path d={bluePath} fill="none" stroke="#3b82f6" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Blue glow */}
      <path d={bluePath} fill="none" stroke="#3b82f6" strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.15} />

      {/* Dots */}
      {timeline.map((t, i) => (
        <g key={i}>
          <circle cx={xScale(i)} cy={yScale(t.cumulativeRedScore)} r={3} fill="#ef4444" />
          <circle cx={xScale(i)} cy={yScale(t.cumulativeBlueScore)} r={3} fill="#3b82f6" />
        </g>
      ))}

      {/* X axis labels */}
      {timeline.map((t, i) => (
        <text
          key={i}
          x={xScale(i)}
          y={height - 6}
          textAnchor="middle"
          className="text-[10px] fill-gray-500"
          style={{ fontFamily: "JetBrains Mono, monospace" }}
        >
          R{t.round}
        </text>
      ))}

      {/* Y axis labels */}
      <text x={padding.left - 8} y={padding.top + 4} textAnchor="end" className="text-[10px] fill-gray-500" style={{ fontFamily: "JetBrains Mono, monospace" }}>
        {maxScore}
      </text>
      <text x={padding.left - 8} y={padding.top + innerH + 4} textAnchor="end" className="text-[10px] fill-gray-500" style={{ fontFamily: "JetBrains Mono, monospace" }}>
        {minScore}
      </text>

      {/* Legend */}
      <circle cx={width - 100} cy={12} r={4} fill="#ef4444" />
      <text x={width - 92} y={16} className="text-[10px] fill-red-400" style={{ fontFamily: "JetBrains Mono, monospace" }}>Red</text>
      <circle cx={width - 55} cy={12} r={4} fill="#3b82f6" />
      <text x={width - 47} y={16} className="text-[10px] fill-blue-400" style={{ fontFamily: "JetBrains Mono, monospace" }}>Blue</text>
    </svg>
  );
}
