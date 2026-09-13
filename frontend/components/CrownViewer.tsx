"use client";

import React, { useState, useRef, useEffect, MouseEvent } from "react";
import { AnalysisResponse, CrownDetection } from "@/types/analysis";

interface CrownViewerProps {
  data: AnalysisResponse;
  originalImageUrl: string | null;
}

export const CrownViewer: React.FC<CrownViewerProps> = ({
  data,
  originalImageUrl,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [showOriginal, setShowOriginal] = useState<boolean>(true);
  const [showCrowns, setShowCrowns] = useState<boolean>(true);
  const [showCentroids, setShowCentroids] = useState<boolean>(true);
  const [showPolygonFills, setShowPolygonFills] = useState<boolean>(true);

  const [selectedCrown, setSelectedCrown] = useState<CrownDetection | null>(null);
  const [hoveredCrown, setHoveredCrown] = useState<CrownDetection | null>(null);
  const [searchTreeId, setSearchTreeId] = useState<string>("");

  const containerRef = useRef<HTMLDivElement>(null);

  // Default select first dominant crown or target crown
  useEffect(() => {
    if (data.crowns && data.crowns.length > 0) {
      // Pick a representative mature crown near center
      const centerCrown = data.crowns.find((c) => c.category.includes("Mature") || c.confidence > 0.9) || data.crowns[0];
      setSelectedCrown(centerCrown);
    }
  }, [data]);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3.5));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.75));
  };

  const handleResetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  // Pan interaction
  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (e.button === 0) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleTreeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTreeId.trim()) return;
    const found = data.crowns.find(
      (c) => c.id.toLowerCase() === searchTreeId.trim().toLowerCase() || c.id.includes(searchTreeId.trim())
    );
    if (found) {
      setSelectedCrown(found);
    }
  };

  // Convert polygon points array to SVG polygon string
  const getPolygonPointsStr = (poly: [number, number][]) => {
    return poly.map((p) => `${p[0]},${p[1]}`).join(" ");
  };

  const activeDisplayCrown = hoveredCrown || selectedCrown;

  return (
    <section id="viewer" className="w-full bg-[#181c1a] border border-[#3d4a42]/40 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
      {/* Viewer Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#68dba9] text-xl">layers</span>
            <h3 className="font-headline font-semibold text-base sm:text-lg text-[#e0e3df]">
              Interactive Multispectral Crown Viewer
            </h3>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-[#1c201e] px-2.5 py-1 rounded-lg border border-[#3d4a42]/40 font-mono-metric text-xs text-[#bccac0]">
            <span>{data.geospatial.source}</span>
            <span>•</span>
            <span className="text-[#68dba9]">{data.trees_detected} crowns</span>
          </div>
        </div>

        {/* Control cluster & layer toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer toggles */}
          <div className="flex items-center bg-[#1c201e] border border-[#3d4a42]/40 rounded-lg p-1 gap-1">
            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono-metric cursor-pointer select-none transition-colors ${
              showOriginal ? "bg-[#272b28] text-[#e0e3df]" : "text-[#87948b]"
            }`}>
              <input
                type="checkbox"
                checked={showOriginal}
                onChange={(e) => setShowOriginal(e.target.checked)}
                className="accent-[#68dba9] w-3.5 h-3.5"
              />
              <span>Original Image</span>
            </label>

            <label className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono-metric cursor-pointer select-none transition-colors ${
              showCrowns ? "bg-[#272b28] text-[#68dba9]" : "text-[#87948b]"
            }`}>
              <input
                type="checkbox"
                checked={showCrowns}
                onChange={(e) => setShowCrowns(e.target.checked)}
                className="accent-[#68dba9] w-3.5 h-3.5"
              />
              <span>Detection Overlay</span>
            </label>

            <label className={`hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-mono-metric cursor-pointer select-none transition-colors ${
              showCentroids ? "bg-[#272b28] text-[#45dfa4]" : "text-[#87948b]"
            }`}>
              <input
                type="checkbox"
                checked={showCentroids}
                onChange={(e) => setShowCentroids(e.target.checked)}
                className="accent-[#45dfa4] w-3.5 h-3.5"
              />
              <span>Apexes</span>
            </label>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center bg-[#1c201e] border border-[#3d4a42]/40 rounded-lg p-1 gap-1">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              type="button"
              className="w-7 h-7 rounded flex items-center justify-center text-[#bccac0] hover:text-[#e0e3df] hover:bg-[#272b28] transition-colors"
            >
              <span className="material-symbols-outlined text-base">add</span>
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              type="button"
              className="w-7 h-7 rounded flex items-center justify-center text-[#bccac0] hover:text-[#e0e3df] hover:bg-[#272b28] transition-colors"
            >
              <span className="material-symbols-outlined text-base">remove</span>
            </button>
            <button
              onClick={handleResetView}
              title="Reset View"
              type="button"
              className="w-7 h-7 rounded flex items-center justify-center text-[#bccac0] hover:text-[#e0e3df] hover:bg-[#272b28] transition-colors"
            >
              <span className="material-symbols-outlined text-base">restart_alt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="relative w-full h-[540px] sm:h-[600px] rounded-xl overflow-hidden bg-[#0b0f0d] border border-[#3d4a42]/50 flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
      >
        {/* Layer container with Pan & Zoom transform */}
        <div
          className="relative transition-transform duration-75 ease-out"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: "center center",
            width: `${data.image_width}px`,
            height: `${data.image_height}px`,
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        >
          {/* Base Satellite Imagery */}
          <img
            src={data.result_image || originalImageUrl || ""}
            alt="Forest satellite imagery"
            className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 ${
              showOriginal ? "opacity-100" : "opacity-0"
            }`}
          />

          {/* SVG Vector Layer for Interactive Crowns */}
          {showCrowns && (
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox={`0 0 ${data.image_width} ${data.image_height}`}
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2.5" floodColor="#68dba9" floodOpacity="0.8" />
                </filter>
                <filter id="amberGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#f59e0b" floodOpacity="0.8" />
                </filter>
              </defs>

              {/* Survey Boundary Polygon */}
              <rect
                x={Math.max(10, data.image_width * 0.02)}
                y={Math.max(10, data.image_height * 0.02)}
                width={data.image_width - Math.max(20, data.image_width * 0.04)}
                height={data.image_height - Math.max(20, data.image_height * 0.04)}
                fill="none"
                stroke="#62dcad"
                strokeWidth="2"
                strokeDasharray="8 6"
                opacity="0.8"
              />

              {/* Render all detected tree crown polygons */}
              {data.crowns.map((crown) => {
                const isSelected = selectedCrown?.id === crown.id;
                const isHovered = hoveredCrown?.id === crown.id;
                const isUncertain = crown.is_uncertain;

                const strokeColor = isSelected
                  ? "#ffffff"
                  : isUncertain
                  ? "#f59e0b"
                  : isHovered
                  ? "#85f8c4"
                  : "#68dba9";

                const strokeWidth = isSelected ? 3 : isHovered ? 2.5 : isUncertain ? 1.5 : 1.8;
                const fillColor = isUncertain ? "#f59e0b" : "#68dba9";
                const fillOpacity = isSelected ? 0.45 : isHovered ? 0.35 : showPolygonFills ? 0.18 : 0.0;

                return (
                  <g
                    key={crown.id}
                    className="cursor-pointer transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCrown(crown);
                    }}
                    onMouseEnter={() => setHoveredCrown(crown)}
                    onMouseLeave={() => setHoveredCrown(null)}
                  >
                    {/* Crown boundary polygon */}
                    {crown.polygon && crown.polygon.length >= 3 ? (
                      <polygon
                        points={getPolygonPointsStr(crown.polygon)}
                        fill={fillColor}
                        fillOpacity={fillOpacity}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        filter={isSelected ? "url(#emeraldGlow)" : undefined}
                      />
                    ) : (
                      <circle
                        cx={crown.center_x}
                        cy={crown.center_y}
                        r={crown.radius_px}
                        fill={fillColor}
                        fillOpacity={fillOpacity}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                      />
                    )}

                    {/* Centroid apex marker */}
                    {showCentroids && (
                      <circle
                        cx={crown.center_x}
                        cy={crown.center_y}
                        r={isSelected ? 4 : 2}
                        fill={isSelected ? "#ffffff" : isUncertain ? "#f59e0b" : "#68dba9"}
                        stroke="#101412"
                        strokeWidth={1}
                      />
                    )}

                    {/* Targeted reticle if selected */}
                    {isSelected && (
                      <circle
                        cx={crown.center_x}
                        cy={crown.center_y}
                        r={Math.max(crown.radius_px + 8, 16)}
                        fill="none"
                        stroke="#68dba9"
                        strokeWidth="1.5"
                        strokeDasharray="4 4"
                        className="animate-spin"
                        style={{
                          transformOrigin: `${crown.center_x}px ${crown.center_y}px`,
                          animationDuration: "10s",
                        }}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Pinned Crown Inspection Tooltip HUD */}
        {activeDisplayCrown && (
          <div
            className="absolute top-4 left-4 z-20 bg-[#101412]/95 backdrop-blur-xl border border-[#68dba9]/40 p-4 rounded-xl shadow-[0_12px_32px_rgba(0,0,0,0.8)] flex flex-col gap-2 max-w-xs transition-all pointer-events-auto"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-headline font-bold text-sm text-[#68dba9]">
                Crown #{activeDisplayCrown.id}
              </span>
              <span className={`px-2 py-0.5 rounded font-mono-metric text-[10px] uppercase ${
                activeDisplayCrown.is_uncertain
                  ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/40"
                  : "bg-[#68dba9]/20 text-[#68dba9] border border-[#68dba9]/40"
              }`}>
                {activeDisplayCrown.is_uncertain ? "Uncertain / Shadow" : "Delineated"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono-metric bg-[#1c201e] p-2.5 rounded-lg border border-[#3d4a42]/40">
              <div>
                <span className="text-[#87948b] block text-[10px]">Area</span>
                <span className="text-[#e0e3df] font-bold">
                  {activeDisplayCrown.area.toLocaleString()} {data.unit}
                </span>
              </div>
              <div>
                <span className="text-[#87948b] block text-[10px]">Radius</span>
                <span className="text-[#e0e3df] font-bold">
                  {activeDisplayCrown.radius_m !== null && activeDisplayCrown.radius_m !== undefined
                    ? `${activeDisplayCrown.radius_m} m`
                    : `${activeDisplayCrown.radius_px} px`}
                </span>
              </div>
              <div>
                <span className="text-[#87948b] block text-[10px]">Confidence</span>
                <span className="text-[#45dfa4] font-bold">
                  {(activeDisplayCrown.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div>
                <span className="text-[#87948b] block text-[10px]">Apex (X, Y)</span>
                <span className="text-[#bccac0]">
                  {activeDisplayCrown.center_x}, {activeDisplayCrown.center_y}
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono-metric text-[#bccac0] flex items-center justify-between pt-0.5">
              <span>Category:</span>
              <span className="text-[#62dcad] font-semibold">{activeDisplayCrown.category}</span>
            </div>
          </div>
        )}

        {/* Floating Geospatial Legend Overlay */}
        <div className="absolute bottom-4 left-4 bg-[#101412]/90 backdrop-blur-md border border-[#3d4a42]/50 p-3.5 rounded-xl shadow-lg z-10 flex flex-col gap-2 max-w-[220px]">
          <div className="font-mono-metric text-[10px] uppercase text-[#87948b] tracking-wider border-b border-[#3d4a42]/40 pb-1">
            Geospatial Legend
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#68dba9] shadow-[0_0_8px_rgba(104,219,169,0.8)]"></span>
            <span className="text-[#e0e3df]">Delineated Crowns</span>
            <span className="ml-auto font-mono-metric text-[#68dba9] font-semibold">
              {data.trees_detected}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-[#62dcad]"></span>
            <span className="text-[#e0e3df]">Survey Boundary</span>
            <span className="ml-auto font-mono-metric text-[#87948b]">AOI</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-[#f59e0b] bg-[#f59e0b]/30"></span>
            <span className="text-[#e0e3df]">Shadow / Edge</span>
            <span className="ml-auto font-mono-metric text-[#f59e0b] font-semibold">
              {data.uncertain_detections_count}
            </span>
          </div>
        </div>

        {/* Live HUD Readout (Top Right) */}
        <div className="absolute top-4 right-4 bg-[#101412]/85 backdrop-blur-md border border-[#3d4a42]/50 px-3 py-1.5 rounded-lg font-mono-metric text-xs text-[#bccac0] hidden sm:flex items-center gap-3">
          <span>GSD: {data.geospatial.gsd ? `${data.geospatial.gsd}m` : "Pixel"}</span>
          <span>•</span>
          <span>Extent: {data.image_width}×{data.image_height}</span>
          <span>•</span>
          <span className="text-[#68dba9] font-medium">Zoom: {Math.round(zoomLevel * 100)}%</span>
        </div>
      </div>
    </section>
  );
};
