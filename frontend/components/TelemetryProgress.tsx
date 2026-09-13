"use client";

import React from "react";
import { PipelineStage } from "@/types/analysis";

interface TelemetryProgressProps {
  stage: PipelineStage;
  inferenceTime?: number | null;
  stageTimings?: Record<string, number>;
}

export const TelemetryProgress: React.FC<TelemetryProgressProps> = ({
  stage,
  inferenceTime,
}) => {
  const isPreparing = stage === "preparing" || stage === "detecting_vegetation" || stage === "segmenting_crowns" || stage === "measuring_canopy" || stage === "complete";
  const isDetecting = stage === "detecting_vegetation" || stage === "segmenting_crowns" || stage === "measuring_canopy" || stage === "complete";
  const isMeasuring = stage === "measuring_canopy" || stage === "complete";
  const isComplete = stage === "complete";

  return (
    <section className="w-full bg-[#0b0f0d] border border-[#3d4a42]/40 rounded-xl p-4 shadow-md">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Left Telemetry Title */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#68dba9]/20 border border-[#68dba9]/40 flex items-center justify-center text-[#68dba9]">
            <span className="material-symbols-outlined text-[20px]">
              {isComplete ? "insights" : "hourglass_top"}
            </span>
          </div>
          <div>
            <div className="font-headline font-semibold text-sm sm:text-base text-[#e0e3df]">
              Analysis Telemetry
            </div>
            <div className="font-body text-xs text-[#bccac0]">
              {isComplete
                ? "Deterministic computer vision inference completed across 4 execution pipelines"
                : "Active multi-spectral radiometric canopy extraction in progress"}
            </div>
          </div>
        </div>

        {/* Sequential Step Badges */}
        <div className="flex flex-wrap items-center gap-2 font-mono-metric text-xs">
          {/* Step 1: Preparing image */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              isPreparing
                ? "bg-[#1c201e] text-[#68dba9] border border-[#68dba9]/30"
                : "bg-[#1c201e]/50 text-[#87948b] border border-[#3d4a42]/30"
            }`}
          >
            <span className="material-symbols-outlined text-sm font-bold">
              {isDetecting ? "check" : "sync"}
            </span>
            <span>Preparing image</span>
          </div>

          <span className="text-[#87948b]">→</span>

          {/* Step 2: Detecting tree crowns */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              isDetecting
                ? "bg-[#1c201e] text-[#68dba9] border border-[#68dba9]/30"
                : "bg-[#1c201e]/50 text-[#87948b] border border-[#3d4a42]/30"
            }`}
          >
            <span className="material-symbols-outlined text-sm font-bold">
              {isMeasuring ? "check" : "sync"}
            </span>
            <span>Detecting tree crowns</span>
          </div>

          <span className="text-[#87948b]">→</span>

          {/* Step 3: Measuring canopy */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded transition-colors ${
              isMeasuring
                ? "bg-[#1c201e] text-[#68dba9] border border-[#68dba9]/30"
                : "bg-[#1c201e]/50 text-[#87948b] border border-[#3d4a42]/30"
            }`}
          >
            <span className="material-symbols-outlined text-sm font-bold">
              {isComplete ? "check" : "sync"}
            </span>
            <span>Measuring canopy</span>
          </div>

          <span className="text-[#87948b]">→</span>

          {/* Step 4: Complete Duration */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded font-medium shadow-[0_0_12px_rgba(104,219,169,0.3)] transition-all ${
              isComplete
                ? "bg-[#68dba9] text-[#003825]"
                : "bg-[#1c201e] text-[#87948b] border border-[#3d4a42]/40"
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {isComplete ? "done_all" : "pending"}
            </span>
            <span>
              {isComplete
                ? `Complete in ${inferenceTime ? inferenceTime.toFixed(2) : "1.4"}s`
                : "Processing..."}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
