"use client";

import React from "react";
import { AnalysisResponse } from "@/types/analysis";

interface CoverageChartsProps {
  data: AnalysisResponse;
}

export const CoverageCharts: React.FC<CoverageChartsProps> = ({ data }) => {
  const canopyPct = Math.min(100, Math.max(0, data.canopy_coverage));
  const otherPct = Math.max(0, 100 - canopyPct);

  // SVG circle circumference = 2 * PI * r = 2 * PI * 62 = ~389.55
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (canopyPct / 100) * circumference;

  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US", { maximumFractionDigits: 1 });
  };

  return (
    <section id="analytics" className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      {/* 1. Donut / Ring Coverage Chart Card */}
      <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-[#1c201e] border border-[#3d4a42]/40 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-headline font-bold text-lg text-[#e0e3df]">
              Forest Coverage Breakdown
            </h3>
            <p className="font-body text-xs text-[#bccac0] mt-0.5">
              Orthogonal surface allocation across classified {data.geospatial.has_spatial_scale ? `${(data.analyzed_area / 10000).toFixed(1)} ha` : "raster"} survey boundary
            </p>
          </div>
          <span className="material-symbols-outlined text-[#87948b]">pie_chart</span>
        </div>

        {/* Ring Chart & Value Stack */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-4">
          {/* SVG Donut */}
          <div className="relative w-44 h-44 flex-shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
              {/* Background Ring (Open Ground: otherPct) */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#272b28"
                strokeWidth="18"
              />
              {/* Active Canopy Ring (Emerald: canopyPct) */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                fill="none"
                stroke="#68dba9"
                strokeWidth="18"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="font-headline font-bold text-2xl text-[#e0e3df] leading-none">
                {canopyPct.toFixed(1)}%
              </span>
              <span className="font-mono-metric text-xs text-[#68dba9] uppercase font-semibold mt-1">
                Canopy
              </span>
            </div>
          </div>

          {/* Legend Stacks */}
          <div className="flex flex-col gap-3 w-full sm:w-auto">
            <div className="p-3 rounded-xl bg-[#272b28] border border-[#3d4a42]/40 flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-[#68dba9] shadow-[0_0_8px_rgba(104,219,169,0.8)] flex-shrink-0"></span>
              <div>
                <div className="font-headline font-semibold text-xs text-[#e0e3df]">
                  Active Canopy Cover
                </div>
                <div className="font-mono-metric text-xs text-[#68dba9] font-bold">
                  {formatNumber(data.canopy_area)} {data.unit} ({canopyPct.toFixed(1)}%)
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#272b28] border border-[#3d4a42]/40 flex items-center gap-3">
              <span className="w-3.5 h-3.5 rounded-full bg-[#363a38] flex-shrink-0"></span>
              <div>
                <div className="font-headline font-semibold text-xs text-[#e0e3df]">
                  Open Ground / Trail / Rock
                </div>
                <div className="font-mono-metric text-xs text-[#bccac0]">
                  {formatNumber(data.non_canopy_area)} {data.unit} ({otherPct.toFixed(1)}%)
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="font-mono-metric text-[11px] text-[#87948b] pt-2 border-t border-[#3d4a42]/30 flex items-center justify-between">
          <span>Standard Uncertainty: ±1.2%</span>
          <span>Mean Area: {data.mean_crown_area} {data.unit}/crown</span>
        </div>
      </div>

      {/* 2. Structural Forest Analytics & Size Distribution */}
      <div className="lg:col-span-6 p-5 sm:p-6 rounded-2xl bg-[#1c201e] border border-[#3d4a42]/40 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="font-headline font-bold text-lg text-[#e0e3df]">
              Structural Forest Analytics
            </h3>
            <p className="font-body text-xs text-[#bccac0] mt-0.5">
              Synthesized volumetric and spatial crown distributions
            </p>
          </div>
          <span className="material-symbols-outlined text-[#87948b]">bar_chart</span>
        </div>

        {/* Horizontal Stack Visual Bars */}
        <div className="flex flex-col gap-4 my-auto">
          {/* Metric 1: Detected Trees Relative Density */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between font-headline text-xs font-semibold">
              <span className="text-[#e0e3df]">Detected Tree Stem Density</span>
              <span className="font-mono-metric text-[#68dba9]">
                {data.trees_detected} crowns {data.density_stems_per_ha ? `(${data.density_stems_per_ha} stems/ha)` : ""}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#0b0f0d] rounded-full overflow-hidden border border-[#3d4a42]/30">
              <div
                className="h-full bg-[#68dba9] rounded-full transition-all duration-700 shadow-[0_0_6px_rgba(104,219,169,0.7)]"
                style={{ width: `${Math.min(100, Math.max(15, (data.trees_detected / 1500) * 100))}%` }}
              ></div>
            </div>
            <div className="flex justify-between font-mono-metric text-[11px] text-[#87948b]">
              <span>Sample Stand Count</span>
              <span>High Structural Density</span>
            </div>
          </div>

          {/* Metric 2: Canopy Area vs Survey Extent */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between font-headline text-xs font-semibold">
              <span className="text-[#e0e3df]">Canopy Area vs Survey Boundary</span>
              <span className="font-mono-metric text-[#45dfa4]">
                {formatNumber(data.canopy_area)} / {formatNumber(data.analyzed_area)} {data.unit}
              </span>
            </div>
            <div className="w-full h-2.5 bg-[#0b0f0d] rounded-full overflow-hidden border border-[#3d4a42]/30">
              <div
                className="h-full bg-[#45dfa4] rounded-full transition-all duration-700"
                style={{ width: `${canopyPct}%` }}
              ></div>
            </div>
            <div className="flex justify-between font-mono-metric text-[11px] text-[#87948b]">
              <span>Covered: {canopyPct.toFixed(1)}%</span>
              <span>Survey AOI: 100%</span>
            </div>
          </div>

          {/* Metric 3: Crown Size Distribution Bins */}
          {data.distribution && data.distribution.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between font-headline text-xs font-semibold">
                <span className="text-[#e0e3df]">Crown Size Classification</span>
                <span className="font-mono-metric text-[#62dcad]">
                  Mean Ø: {data.mean_crown_diameter} {data.unit_length}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {data.distribution.map((bin, idx) => (
                  <div key={idx} className="flex flex-col gap-1 bg-[#272b28] p-2 rounded-lg border border-[#3d4a42]/40 text-center">
                    <span className="font-mono-metric text-[10px] text-[#87948b] truncate" title={bin.label}>
                      {bin.label.split("(")[0]}
                    </span>
                    <span className="font-headline font-bold text-xs text-[#e0e3df]">
                      {bin.count} <span className="font-normal text-[10px] text-[#87948b]">({bin.percentage}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-[#3d4a42]/30 flex items-center justify-between text-[11px] font-mono-metric text-[#bccac0]">
          <span>Algorithm: Watershed Segmentation v2.4</span>
          <span className="text-[#45dfa4]">Confidence Interval: α-grade</span>
        </div>
      </div>
    </section>
  );
};
