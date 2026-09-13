"use client";

import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0b0f0d] border-t border-[#3d4a42]/30 py-6 mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#87948b]">
          <span className="font-headline font-semibold text-[#e0e3df]">
            ForestVision AI
          </span>
          <span className="font-mono-metric">•</span>
          <span>Canopy Intelligence Infrastructure</span>
          <span className="font-mono-metric">•</span>
          <span>FastAPI + Next.js CV Core</span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono-metric text-[#87948b]">
          <span>Engine v2.4.0-prod-sat</span>
          <span>•</span>
          <span className="text-[#68dba9]">Deterministic Analysis</span>
        </div>
      </div>
    </footer>
  );
};
