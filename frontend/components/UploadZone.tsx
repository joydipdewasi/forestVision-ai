"use client";

import React, { useState, useRef, ChangeEvent, DragEvent } from "react";
import { SampleDatasetInfo } from "@/types/analysis";

interface UploadZoneProps {
  selectedFile: File | null;
  previewUrl: string | null;
  fileMetadata: {
    name: string;
    size: string;
    dimensions?: string;
    gsd?: number | null;
    isGeotiff?: boolean;
    location?: string;
    sensor?: string;
  } | null;
  customGsd: number | null;
  samples: SampleDatasetInfo[];
  isAnalyzing: boolean;
  onFileSelect: (file: File) => void;
  onSelectSample: (sample: SampleDatasetInfo) => void;
  onGsdChange: (gsd: number | null) => void;
  onAnalyze: () => void;
  onClear: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  selectedFile,
  previewUrl,
  fileMetadata,
  customGsd,
  samples,
  isAnalyzing,
  onFileSelect,
  onSelectSample,
  onGsdChange,
  onAnalyze,
  onClear,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showSampleModal, setShowSampleModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      onFileSelect(file);
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      onFileSelect(file);
    }
  };

  return (
    <section className="w-full bg-[#181c1a] border border-[#3d4a42]/40 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-[#68dba9]/5 blur-3xl pointer-events-none"></div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Dropzone Card (Left Column) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`lg:col-span-5 flex flex-col justify-between min-h-[340px] p-5 sm:p-6 rounded-xl border-2 transition-all cursor-pointer group ${
            isDragging
              ? "border-[#68dba9] bg-[#1c201e] scale-[1.01]"
              : "border-[#3d4a42]/60 hover:border-[#68dba9]/50 bg-[#1c201e]"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.tif,.tiff"
            className="hidden"
            onChange={handleFileInputChange}
          />

          <div className="flex items-center justify-between">
            <span className="font-mono-metric text-xs uppercase tracking-wider text-[#bccac0]">
              Step 01 • Ingestion
            </span>
            <span className="material-symbols-outlined text-[#87948b] group-hover:text-[#68dba9] transition-colors">
              cloud_upload
            </span>
          </div>

          <div className="flex flex-col items-center text-center my-4 gap-2">
            <div className="w-16 h-16 rounded-full bg-[#272b28] border border-[#3d4a42] flex items-center justify-center text-[#68dba9] group-hover:scale-105 transition-transform shadow-md">
              <span className="material-symbols-outlined text-3xl">add_photo_alternate</span>
            </div>
            <h2 className="font-headline font-semibold text-lg text-[#e0e3df] mt-1">
              Upload Forest Image
            </h2>
            <p className="font-body text-xs sm:text-sm text-[#bccac0] max-w-xs leading-relaxed">
              Drop a satellite GeoTIFF, orthomosaic, or drone raster here or browse local files
            </p>
            <span className="inline-block mt-1 px-2.5 py-1 rounded bg-[#323633] text-[#bccac0] font-mono-metric text-xs">
              Supported: JPG • PNG • TIFF (up to 60MB)
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#3d4a42]/30">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowSampleModal(true);
              }}
              className="font-mono-metric text-xs text-[#45dfa4] hover:text-[#85f8c4] transition-colors flex items-center gap-1.5 py-1 px-2 rounded hover:bg-[#272b28]"
            >
              <span className="material-symbols-outlined text-sm">auto_fix</span>
              <span>Select Sample Forest</span>
            </button>
            <span className="font-mono-metric text-[11px] text-[#87948b]">
              SR: WGS84 / UTM
            </span>
          </div>
        </div>

        {/* Selected File Active Ingestion Card (Right Column) */}
        <div className="lg:col-span-7 flex flex-col justify-between p-5 sm:p-6 rounded-xl bg-[#1c201e] border border-[#3d4a42]/40 shadow-md">
          {/* Header row */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-[#272b28] border border-[#3d4a42] flex items-center justify-center text-[#68dba9] flex-shrink-0">
                <span className="material-symbols-outlined">satellite_alt</span>
              </div>
              <div className="min-w-0">
                <div className="font-headline font-semibold text-sm sm:text-base text-[#e0e3df] truncate">
                  {fileMetadata?.name || "No image loaded"}
                </div>
                <div className="font-mono-metric text-xs text-[#87948b] truncate mt-0.5">
                  {fileMetadata
                    ? `${fileMetadata.size} • ${fileMetadata.dimensions || "Raster AOI"} • ${
                        customGsd ? `${customGsd}m GSD` : "Image Pixels"
                      }`
                    : "Select a sample or upload a file to begin"}
                </div>
              </div>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded bg-[#68dba9]/10 border border-[#68dba9]/30 text-[#68dba9] font-mono-metric text-xs uppercase whitespace-nowrap">
                  Active AOI
                </span>
                <button
                  onClick={onClear}
                  title="Remove image"
                  className="w-7 h-7 rounded bg-[#272b28] hover:bg-[#323633] text-[#87948b] hover:text-[#ffb4ab] flex items-center justify-center transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
            )}
          </div>

          {/* Thumbnail Preview Framing */}
          <div className="relative w-full h-44 rounded-lg overflow-hidden my-2 bg-[#0b0f0d] border border-[#3d4a42]/40 flex items-center justify-center">
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Active AOI preview"
                  className="w-full h-full object-cover opacity-90 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f0d] via-transparent to-transparent"></div>
                <div className="absolute top-2 left-2 px-2 py-1 rounded bg-[#101412]/80 backdrop-blur-md text-[#e0e3df] font-mono-metric text-[11px] flex items-center gap-1.5 border border-[#3d4a42]/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#68dba9]"></span>
                  <span>{fileMetadata?.sensor || "Orthorectified RGB"}</span>
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-[#101412]/80 backdrop-blur-md text-[#bccac0] font-mono-metric text-[11px] border border-[#3d4a42]/40">
                  {fileMetadata?.location || "AOI Survey Extent"}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-[#87948b]">
                <span className="material-symbols-outlined text-3xl">image</span>
                <span className="font-mono-metric text-xs">Awaiting Forest Imagery Ingestion</span>
              </div>
            )}
          </div>

          {/* Spatial Resolution (GSD) Scale Selector Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#3d4a42]/30">
            <div className="flex items-center gap-2">
              <span className="font-mono-metric text-xs text-[#87948b]">Scale (GSD):</span>
              <select
                value={customGsd === null ? "uncalibrated" : customGsd.toString()}
                onChange={(e) => {
                  const val = e.target.value;
                  onGsdChange(val === "uncalibrated" ? null : parseFloat(val));
                }}
                className="bg-[#272b28] border border-[#3d4a42] text-[#e0e3df] text-xs rounded px-2.5 py-1 font-mono-metric focus:outline-none focus:border-[#68dba9]"
              >
                <option value="0.10">0.10 m/px (Ultra High-Res UAV)</option>
                <option value="0.15">0.15 m/px (Aerial Orthophoto)</option>
                <option value="0.25">0.25 m/px (Maxar WorldView-3)</option>
                <option value="0.30">0.30 m/px (Sentinel-2 L2A High-Res)</option>
                <option value="0.50">0.50 m/px (PlanetScope Satellite)</option>
                <option value="1.00">1.00 m/px (Coarse Aerial)</option>
                <option value="uncalibrated">Image Pixels (Uncalibrated)</option>
              </select>
            </div>

            {/* Analyze Forest CTA Button */}
            <button
              onClick={onAnalyze}
              disabled={!selectedFile || isAnalyzing}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-lg font-headline font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                !selectedFile || isAnalyzing
                  ? "bg-[#272b28] text-[#87948b] cursor-not-allowed border border-[#3d4a42]"
                  : "bg-[#68dba9] hover:bg-[#85f8c4] text-[#003825] shadow-[0_0_20px_rgba(104,219,169,0.3)] hover:shadow-[0_0_24px_rgba(104,219,169,0.5)] cursor-pointer"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    refresh
                  </span>
                  <span>Processing Forest...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    document_scanner
                  </span>
                  <span>Analyze Forest</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sample Dataset Selector Modal */}
      {showSampleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowSampleModal(false)}
        >
          <div
            className="bg-[#181c1a] border border-[#3d4a42] rounded-2xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#3d4a42]/40">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#68dba9]">collections</span>
                <h3 className="font-headline font-bold text-lg text-[#e0e3df]">
                  Select Pre-Packaged Forest Dataset
                </h3>
              </div>
              <button
                onClick={() => setShowSampleModal(false)}
                className="w-8 h-8 rounded-lg bg-[#272b28] text-[#bccac0] hover:text-[#e0e3df] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <p className="font-body text-xs text-[#bccac0]">
              Click any sample dataset below to immediately load authentic high-resolution satellite imagery with pre-calibrated sensor GSD tags for 1-click evaluation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-1">
              {samples.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSample(s);
                    setShowSampleModal(false);
                  }}
                  className="flex flex-col justify-between p-3.5 rounded-xl bg-[#1c201e] hover:bg-[#272b28] border border-[#3d4a42]/60 hover:border-[#68dba9]/60 cursor-pointer transition-all group"
                >
                  <div className="relative h-28 rounded-lg overflow-hidden mb-2.5 bg-[#0b0f0d]">
                    <img
                      src={s.thumbnail_url}
                      alt={s.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-[#101412]/85 text-[#68dba9] font-mono-metric text-[10px] border border-[#68dba9]/30">
                      {s.default_gsd}m GSD
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-[#101412]/85 text-[#bccac0] font-mono-metric text-[10px]">
                      {s.approx_trees}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-headline font-semibold text-sm text-[#e0e3df] group-hover:text-[#68dba9] transition-colors">
                      {s.name}
                    </h4>
                    <p className="font-body text-xs text-[#87948b] line-clamp-2 mt-1">
                      {s.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between font-mono-metric text-[11px] text-[#87948b] pt-2 mt-2 border-t border-[#3d4a42]/30">
                    <span>{s.file_size_display}</span>
                    <span className="text-[#45dfa4] group-hover:underline">Load Dataset →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
