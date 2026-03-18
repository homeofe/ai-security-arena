"use client";

import { useMemo } from "react";
import { generateMockReport } from "@/lib/report-generator";
import { ReportHeader } from "@/components/ReportHeader";
import { ScoreOverview } from "@/components/ScoreOverview";
import { DecisionTimeline } from "@/components/DecisionTimeline";
import { ReasoningViewer } from "@/components/ReasoningViewer";
import { StrategyBreakdown } from "@/components/StrategyBreakdown";
import { TurningPoints } from "@/components/TurningPoints";
import { ExportButtons } from "@/components/ExportButtons";

export default function ReportPage() {
  // For now, use mock data. In production, this would load from URL params or state.
  const report = useMemo(() => generateMockReport(), []);

  return (
    <div className="space-y-8 animate-float-in pb-12 report-page">
      {/* A. Report Header */}
      <ReportHeader match={report.match} />

      {/* B. Score Overview */}
      <ScoreOverview report={report} />

      {/* C. Decision Timeline */}
      <DecisionTimeline report={report} />

      {/* D. Team Reasoning */}
      <ReasoningViewer reasoning={report.reasoning} />

      {/* E. Strategy Analysis */}
      <StrategyBreakdown analysis={report.strategyAnalysis} />

      {/* F. Turning Points */}
      <TurningPoints turningPoints={report.turningPoints} />

      {/* G. Export Section */}
      <ExportButtons report={report} />
    </div>
  );
}
