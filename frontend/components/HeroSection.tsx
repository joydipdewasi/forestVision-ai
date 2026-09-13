"use client";

import React from "react";

export const HeroSection: React.FC = () => {
  return (
    <section className="flex flex-col items-center text-center gap-3 max-w-3xl mx-auto pt-6 pb-2">
      {/* Top Telemetry Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#272b28] border border-[#68dba9]/30 text-[#68dba9] font-mono-metric text-xs tracking-wider shadow-sm">
        <span className="w-2 h-2 rounded-full bg-[#68dba9] animate-ping"></span>
        <span>RAPID GEOSPATIAL CANOPY ESTIMATION</span>
      </div>

      {/* Primary Headline */}
      <h1 className="font-headline font-bold text-3xl sm:text-4xl md:text-5xl text-[#e0e3df] tracking-tight mt-1 leading-[1.15]">
        See Every Tree. <span className="text-[#68dba9]">Measure the Canopy.</span>
      </h1>

      {/* Explanatory Body */}
      <p className="font-body text-[#bccac0] text-sm sm:text-base max-w-2xl leading-relaxed">
        Upload high-resolution multispectral or aerial forest imagery to immediately delineate crown geometries, 
        enumerate individual trees, and compute certified surface coverage percentages using deterministic computer vision.
      </p>
    </section>
  );
};
