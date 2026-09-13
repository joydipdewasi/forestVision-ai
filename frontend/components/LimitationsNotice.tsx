"use client";

import React from "react";
import { GeospatialMetadata } from "@/types/analysis";

interface LimitationsNoticeProps {
  geospatial?: GeospatialMetadata;
}

export const LimitationsNotice: React.FC<LimitationsNoticeProps> = ({ geospatial }) => {
  return (
    <section id="methodology" className="w-full p-5 sm:p-6 rounded-2xl bg-[#0b0f0d] border border-[#3d4a42]/40 flex items-start gap-4 shadow-sm">
      <div className="w-9 h-9 rounded-full bg-[#272b28] border border-[#3d4a42] flex items-center justify-center text-[#87948b] flex-shrink-0 mt-0.5">
        <span className="material-symbols-outlined text-lg text-[#68dba9]">verified_user</span>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-headline font-bold text-sm sm:text-base text-[#e0e3df]">
            Scientific Integrity &amp; Methodological Limitations
          </h4>
          <span className="px-2 py-0.5 rounded bg-[#272b28] text-[#87948b] font-mono-metric text-[10px]">
            ISO 14064 / IPCC Good Practice Guidance
          </span>
        </div>

        <p className="font-body text-xs sm:text-sm text-[#bccac0] leading-relaxed">
          Tree detection counts and canopy surface measurements are probabilistic estimations computed deterministically 
          via spectral vegetation indexing (ExG/GLI), radiometric scale-space apex detection, and marker-controlled watershed segmentation. 
          Measurements are strictly derived from orthogonal image raster properties.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono-metric text-[#87948b]">
          <div className="p-2.5 rounded-lg bg-[#181c1a] border border-[#3d4a42]/30">
            <span className="text-[#e0e3df] font-semibold block mb-0.5">Spatial Resolution (GSD)</span>
            <span>Accurate to within ±0.5m when sensor GSD is calibrated. Sub-pixel crowns under 1.5m may be aggregated.</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#181c1a] border border-[#3d4a42]/30">
            <span className="text-[#e0e3df] font-semibold block mb-0.5">Crown Interlocking</span>
            <span>Dense continuous canopy matrices may exhibit shared watershed boundaries. Field-truthing recommended.</span>
          </div>

          <div className="p-2.5 rounded-lg bg-[#181c1a] border border-[#3d4a42]/30">
            <span className="text-[#e0e3df] font-semibold block mb-0.5">Scale Transparency</span>
            <span>{geospatial?.disclaimer || "Calibrated scale used for real-world m² calculations."}</span>
          </div>
        </div>
      </div>
    </section>
  );
};
