"use client";

import React from "react";

interface HeaderProps {
  onSelectSample?: (sampleId: string) => void;
  onScrollToSection?: (sectionId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onScrollToSection }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#101412]/80 backdrop-blur-xl border-b border-[#3d4a42]/30 shadow-[0_1px_8px_rgba(0,0,0,0.4)]">
      <div className="h-16 max-w-7xl mx-auto px-4 sm:px-8 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            <div className="w-9 h-9 rounded-lg bg-[#272b28] border border-[#68dba9]/40 flex items-center justify-center shadow-[0_0_12px_rgba(104,219,169,0.2)]">
              <span className="material-symbols-outlined text-[#68dba9] text-[22px]">
                forest
              </span>
            </div>
            <div className="flex flex-col">
              <span className="font-headline font-bold text-lg text-[#e0e3df] tracking-tight leading-none">
                Forest<span className="text-[#68dba9]">Vision</span>
              </span>
              <span className="font-mono-metric text-[10px] text-[#87948b] tracking-wider uppercase mt-0.5">
                Canopy Intelligence
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onScrollToSection?.("overview")}
              className="px-3.5 py-1.5 font-medium text-xs rounded-lg text-[#e0e3df] bg-[#272b28] hover:bg-[#323633] transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => onScrollToSection?.("viewer")}
              className="px-3.5 py-1.5 font-medium text-xs rounded-lg text-[#bccac0] hover:text-[#e0e3df] hover:bg-[#181c1a] transition-colors"
            >
              Multispectral Viewer
            </button>
            <button
              onClick={() => onScrollToSection?.("analytics")}
              className="px-3.5 py-1.5 font-medium text-xs rounded-lg text-[#bccac0] hover:text-[#e0e3df] hover:bg-[#181c1a] transition-colors"
            >
              Analytics
            </button>
            <button
              onClick={() => onScrollToSection?.("methodology")}
              className="px-3.5 py-1.5 font-medium text-xs rounded-lg text-[#bccac0] hover:text-[#e0e3df] hover:bg-[#181c1a] transition-colors"
            >
              Scientific Integrity
            </button>
          </nav>
        </div>

        {/* Status Telemetry & Model Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-[#181c1a] border border-[#3d4a42]/60 shadow-[0_0_12px_rgba(5,150,105,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#68dba9] animate-pulse"></span>
            <span className="font-mono-metric text-xs text-[#68dba9] font-medium">
              Model v2.4 • Ready
            </span>
          </div>

          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#1c201e] border border-[#3d4a42]/40 text-[#bccac0] text-xs font-mono-metric">
            <span className="material-symbols-outlined text-sm text-[#45dfa4]">satellite_alt</span>
            <span>Sentinel &amp; Aerial</span>
          </div>
        </div>
      </div>
    </header>
  );
};
