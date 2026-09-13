"use client";

import React, { useState } from "react";
import { AnalysisResponse } from "@/types/analysis";

interface ExportSectionProps {
  data: AnalysisResponse;
}

export const ExportSection: React.FC<ExportSectionProps> = ({ data }) => {
  const [copied, setCopied] = useState(false);

  // 1. Download CSV
  const handleDownloadCsv = () => {
    let csvContent = "tree_id,center_x,center_y,radius_px,radius_m,area,confidence,category,is_uncertain\n";
    data.crowns.forEach((c) => {
      csvContent += `${c.id},${c.center_x},${c.center_y},${c.radius_px},${c.radius_m || ""},${c.area},${c.confidence},"${c.category}",${c.is_uncertain}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `forestvision_crowns_telemetry_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 2. Download Annotated PNG
  const handleDownloadImage = () => {
    if (!data.result_image) return;
    const link = document.createElement("a");
    link.href = data.result_image;
    link.setAttribute("download", `forestvision_annotated_canopy_${Date.now()}.png`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Download GeoJSON
  const handleDownloadGeoJson = () => {
    const geojson = {
      type: "FeatureCollection",
      metadata: {
        platform: "ForestVision AI Canopy Intelligence",
        trees_detected: data.trees_detected,
        canopy_area: data.canopy_area,
        analyzed_area: data.analyzed_area,
        canopy_coverage: data.canopy_coverage,
        unit: data.unit,
        gsd: data.geospatial.gsd,
        timestamp: new Date().toISOString(),
      },
      features: data.crowns.map((c) => ({
        type: "Feature",
        properties: {
          id: c.id,
          area: c.area,
          radius_px: c.radius_px,
          radius_m: c.radius_m,
          confidence: c.confidence,
          category: c.category,
          is_uncertain: c.is_uncertain,
        },
        geometry: {
          type: "Polygon",
          coordinates: c.polygon && c.polygon.length > 0 ? [c.polygon] : [],
        },
      })),
    };

    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: "application/geo+json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `forestvision_vector_polygons_${Date.now()}.geojson`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 4. Print / PDF Summary Report
  const handlePrintReport = () => {
    window.print();
  };

  // 5. Copy Link
  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <section className="w-full bg-[#181c1a] border border-[#3d4a42]/40 rounded-2xl p-5 sm:p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="max-w-xl">
        <div className="flex items-center gap-2 text-[#68dba9] font-mono-metric text-xs uppercase tracking-wider mb-1">
          <span className="material-symbols-outlined text-base">ios_share</span>
          <span>Institutional Export</span>
        </div>
        <h3 className="font-headline font-bold text-lg sm:text-xl text-[#e0e3df]">
          Share &amp; Export Results
        </h3>
        <p className="font-body text-xs sm:text-sm text-[#bccac0] mt-1 leading-relaxed">
          Download compliance-ready telemetry packages containing exact polygon coordinates, crown radii telemetry, and geospatial layer exports.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
        <button
          type="button"
          onClick={handleDownloadImage}
          className="flex-1 md:flex-initial px-4 py-2.5 rounded-lg bg-[#272b28] hover:bg-[#323633] text-[#e0e3df] font-headline font-semibold text-xs flex items-center justify-center gap-2 border border-[#3d4a42] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#68dba9] text-lg">image</span>
          <span>Annotated PNG</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadCsv}
          className="flex-1 md:flex-initial px-4 py-2.5 rounded-lg bg-[#272b28] hover:bg-[#323633] text-[#e0e3df] font-headline font-semibold text-xs flex items-center justify-center gap-2 border border-[#3d4a42] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#45dfa4] text-lg">table_view</span>
          <span>Telemetry CSV</span>
        </button>

        <button
          type="button"
          onClick={handleDownloadGeoJson}
          className="flex-1 md:flex-initial px-4 py-2.5 rounded-lg bg-[#272b28] hover:bg-[#323633] text-[#e0e3df] font-headline font-semibold text-xs flex items-center justify-center gap-2 border border-[#3d4a42] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#62dcad] text-lg">polyline</span>
          <span>GeoJSON</span>
        </button>

        <button
          type="button"
          onClick={handlePrintReport}
          className="flex-1 md:flex-initial px-4 py-2.5 rounded-lg bg-[#272b28] hover:bg-[#323633] text-[#e0e3df] font-headline font-semibold text-xs flex items-center justify-center gap-2 border border-[#3d4a42] transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[#68dba9] text-lg">picture_as_pdf</span>
          <span>Print Report</span>
        </button>

        <button
          type="button"
          onClick={handleCopyLink}
          className="w-full md:w-auto px-4 py-2.5 rounded-lg bg-[#68dba9] hover:bg-[#85f8c4] text-[#003825] font-headline font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">link</span>
          <span>{copied ? "Copied to Clipboard!" : "Copy Results Link"}</span>
        </button>
      </div>
    </section>
  );
};
