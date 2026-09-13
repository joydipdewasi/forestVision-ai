"use client";

import React from "react";
import { AnalysisResponse } from "@/types/analysis";

interface ResultsCardsProps {
  data: AnalysisResponse;
}

export const ResultsCards: React.FC<ResultsCardsProps> = ({ data }) => {
  const isMetric = data.unit === "m²";
  
  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString("en-US", { maximumFractionDigits: 1 });
  };

  const canopyHa = isMetric ? (data.canopy_area / 10000.0).toFixed(2) : null;
  const analyzedHa = isMetric ? (data.analyzed_area / 10000.0).toFixed(2) : null;

  return (
    <section className="flex flex-col gap-4">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-headline font-bold text-xl sm:text-2xl text-[#e0e3df]">
              Forest Analysis Results
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-[#272b28] text-[#68dba9] font-mono-metric text-xs flex items-center gap-1.5 border border-[#68dba9]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#68dba9] animate-pulse"></span>
              Analyzed Just Now
            </span>
          </div>
          <p className="font-body text-xs sm:text-sm text-[#bccac0] mt-0.5">
            Continuous multispectral crown extraction &amp; geometric area telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono-metric text-xs text-[#87948b]">Calibration Scale:</span>
          <span className="font-mono-metric text-xs text-[#68dba9] font-semibold">
            {data.geospatial.has_spatial_scale
              ? `${data.geospatial.gsd}m GSD (${data.geospatial.source})`
              : "Image-Space (Pixels)"}
          </span>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Highlight KPI Card (Canopy Coverage %) */}
        <div className="xl:col-span-1 p-5 sm:p-6 rounded-2xl bg-[#272b28] border border-[#68dba9]/40 relative overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-[#68dba9]/20 blur-2xl pointer-events-none"></div>

          <div className="flex items-center justify-between">
            <span className="font-mono-metric text-xs text-[#68dba9] uppercase tracking-wider font-semibold">
              Primary Metric
            </span>
            <span className="material-symbols-outlined text-[#68dba9]">eco</span>
          </div>

          <div className="my-4">
            <div className="flex items-baseline gap-2">
              <span className="font-headline font-bold text-4xl sm:text-5xl text-[#68dba9] tracking-tight">
                {data.canopy_coverage.toFixed(1)}%
              </span>
              <span className="font-mono-metric text-xs text-[#bccac0] font-semibold">COVERAGE</span>
            </div>
            <div className="font-headline font-semibold text-base text-[#e0e3df] mt-1">
              Canopy Coverage
            </div>
            <p className="font-body text-xs text-[#bccac0] mt-1 leading-relaxed">
              Percentage of surveyed terrain occupied by classified horizontal tree crown surface.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-[#0b0f0d] rounded-full h-2 overflow-hidden border border-[#3d4a42]/40">
            <div
              className="bg-[#68dba9] h-full rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(104,219,169,0.8)]"
              style={{ width: `${Math.min(100, Math.max(0, data.canopy_coverage))}%` }}
            ></div>
          </div>
        </div>

        {/* Stat Card 1: Trees Detected */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#1c201e] border border-[#3d4a42]/40 flex flex-col justify-between shadow-md hover:border-[#45dfa4]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-lg bg-[#272b28] border border-[#3d4a42] flex items-center justify-center text-[#45dfa4]">
              <span className="material-symbols-outlined text-[20px]">park</span>
            </span>
            <span className="font-mono-metric text-xs text-[#87948b] uppercase">COUNT</span>
          </div>

          <div className="my-2">
            <div className="font-headline font-bold text-3xl text-[#e0e3df]">
              {data.trees_detected.toLocaleString()}
            </div>
            <div className="font-headline font-semibold text-sm text-[#45dfa4] mt-0.5">
              Trees Detected
            </div>
            <p className="font-body text-xs text-[#bccac0] mt-1">
              Individual tree crowns identified via radiometric peaks &amp; watershed masks.
            </p>
          </div>

          <div className="flex items-center justify-between font-mono-metric text-xs pt-2 border-t border-[#3d4a42]/30 text-[#87948b]">
            <span>Density</span>
            <span className="text-[#e0e3df] font-semibold">
              {data.density_stems_per_ha !== null && data.density_stems_per_ha !== undefined
                ? `${data.density_stems_per_ha} stems/ha`
                : `${(data.trees_detected / (data.analyzed_area / 1000000)).toFixed(0)} stems/Mpx`}
            </span>
          </div>
        </div>

        {/* Stat Card 2: Estimated Canopy Area */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#1c201e] border border-[#3d4a42]/40 flex flex-col justify-between shadow-md hover:border-[#68dba9]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-lg bg-[#272b28] border border-[#3d4a42] flex items-center justify-center text-[#68dba9]">
              <span className="material-symbols-outlined text-[20px]">square_foot</span>
            </span>
            <span className="font-mono-metric text-xs text-[#87948b] uppercase">SURFACE</span>
          </div>

          <div className="my-2">
            <div className="font-headline font-bold text-3xl text-[#e0e3df] flex items-baseline gap-1">
              <span>{formatNumber(data.canopy_area)}</span>
              <span className="text-sm font-normal text-[#87948b]">{data.unit}</span>
            </div>
            <div className="font-headline font-semibold text-sm text-[#68dba9] mt-0.5">
              Estimated Canopy Area
            </div>
            <p className="font-body text-xs text-[#bccac0] mt-1">
              Total horizontal surface covered by delineated photosynthetic crowns.
            </p>
          </div>

          <div className="flex items-center justify-between font-mono-metric text-xs pt-2 border-t border-[#3d4a42]/30 text-[#87948b]">
            <span>Net Footprint</span>
            <span className="text-[#e0e3df] font-semibold">
              {canopyHa ? `${canopyHa} ha net` : `${formatNumber(data.canopy_area)} px²`}
            </span>
          </div>
        </div>

        {/* Stat Card 3: Area Analyzed */}
        <div className="p-5 sm:p-6 rounded-2xl bg-[#1c201e] border border-[#3d4a42]/40 flex flex-col justify-between shadow-md hover:border-[#62dcad]/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="w-9 h-9 rounded-lg bg-[#272b28] border border-[#3d4a42] flex items-center justify-center text-[#62dcad]">
              <span className="material-symbols-outlined text-[20px]">crop_free</span>
            </span>
            <span className="font-mono-metric text-xs text-[#87948b] uppercase">SURVEY AOI</span>
          </div>

          <div className="my-2">
            <div className="font-headline font-bold text-3xl text-[#e0e3df] flex items-baseline gap-1">
              <span>{formatNumber(data.analyzed_area)}</span>
              <span className="text-sm font-normal text-[#87948b]">{data.unit}</span>
            </div>
            <div className="font-headline font-semibold text-sm text-[#62dcad] mt-0.5">
              Area Analyzed
            </div>
            <p className="font-body text-xs text-[#bccac0] mt-1">
              Total surveyed terrain inside the orthogonal bounding polygon.
            </p>
          </div>

          <div className="flex items-center justify-between font-mono-metric text-xs pt-2 border-t border-[#3d4a42]/30 text-[#87948b]">
            <span>Total Extent</span>
            <span className="text-[#e0e3df] font-semibold">
              {analyzedHa ? `${analyzedHa} ha gross` : `${data.image_width}×${data.image_height} px`}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
