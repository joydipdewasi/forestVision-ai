"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { UploadZone } from "@/components/UploadZone";
import { TelemetryProgress } from "@/components/TelemetryProgress";
import { ResultsCards } from "@/components/ResultsCards";
import { CrownViewer } from "@/components/CrownViewer";
import { CoverageCharts } from "@/components/CoverageCharts";
import { ExportSection } from "@/components/ExportSection";
import { LimitationsNotice } from "@/components/LimitationsNotice";
import { Footer } from "@/components/Footer";

import { analyzeImage, fetchSampleCatalog } from "@/lib/api";
import { AnalysisResponse, SampleDatasetInfo, PipelineStage } from "@/types/analysis";

export default function HomePage() {
  const [samples, setSamples] = useState<SampleDatasetInfo[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileMetadata, setFileMetadata] = useState<{
    name: string;
    size: string;
    dimensions?: string;
    gsd?: number | null;
    isGeotiff?: boolean;
    location?: string;
    sensor?: string;
  } | null>(null);

  const [customGsd, setCustomGsd] = useState<number | null>(0.30);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("idle");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load sample catalog and initialize with first default sample
  useEffect(() => {
    async function initCatalog() {
      const catalog = await fetchSampleCatalog();
      setSamples(catalog);

      if (catalog && catalog.length > 0) {
        loadSample(catalog[0]);
      }
    }
    initCatalog();
  }, []);

  const loadSample = async (sample: SampleDatasetInfo) => {
    try {
      setErrorMessage(null);
      setAnalysisResult(null);
      setPipelineStage("idle");

      const res = await fetch(`/samples/${sample.filename}`);
      const blob = await res.blob();
      const file = new File([blob], sample.filename, { type: "image/png" });

      setSelectedFile(file);
      setPreviewUrl(`/samples/${sample.filename}`);
      setCustomGsd(sample.default_gsd);
      setFileMetadata({
        name: sample.filename,
        size: sample.file_size_display,
        dimensions: "1024 × 640 px",
        gsd: sample.default_gsd,
        isGeotiff: sample.has_georeference,
        location: sample.location,
        sensor: sample.sensor_type,
      });
    } catch (err) {
      console.error("Failed to load sample dataset:", err);
    }
  };

  const handleFileSelect = (file: File) => {
    setErrorMessage(null);
    setAnalysisResult(null);
    setPipelineStage("idle");

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Format file size
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    const isTiff = file.name.toLowerCase().endsWith(".tif") || file.name.toLowerCase().endsWith(".tiff");

    // Read image dimensions
    const img = new Image();
    img.onload = () => {
      setFileMetadata({
        name: file.name,
        size: `${sizeMb} MB`,
        dimensions: `${img.width} × ${img.height} px`,
        gsd: customGsd,
        isGeotiff: isTiff,
        location: "Uploaded File Extent",
        sensor: isTiff ? "GeoTIFF Raster Data" : "Standard Raster RGB",
      });
    };
    img.src = objectUrl;
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileMetadata(null);
    setAnalysisResult(null);
    setPipelineStage("idle");
    setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);

    // Progressive stage simulation for responsive user feedback
    setPipelineStage("preparing");
    const t1 = setTimeout(() => setPipelineStage("detecting_vegetation"), 200);
    const t2 = setTimeout(() => setPipelineStage("segmenting_crowns"), 500);
    const t3 = setTimeout(() => setPipelineStage("measuring_canopy"), 900);

    try {
      const result = await analyzeImage(selectedFile, selectedFile.name, customGsd);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      setAnalysisResult(result);
      setPipelineStage("complete");

      // Auto smooth scroll to results on complete
      setTimeout(() => {
        const resultsEl = document.getElementById("results-section");
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    } catch (err: any) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      setPipelineStage("error");
      setErrorMessage(err.message || "An unexpected error occurred during forest analysis.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#101412] text-[#e0e3df]">
      {/* 1. Header */}
      <Header onScrollToSection={scrollToSection} />

      {/* Main Content Area */}
      <main className="flex-1 w-full pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-6 flex flex-col gap-8">
          {/* 2. Hero Section */}
          <HeroSection />

          {/* 3. Upload & Ingestion Zone */}
          <UploadZone
            selectedFile={selectedFile}
            previewUrl={previewUrl}
            fileMetadata={fileMetadata}
            customGsd={customGsd}
            samples={samples}
            isAnalyzing={isAnalyzing}
            onFileSelect={handleFileSelect}
            onSelectSample={loadSample}
            onGsdChange={setCustomGsd}
            onAnalyze={handleAnalyze}
            onClear={handleClear}
          />

          {/* Error Banner if any */}
          {errorMessage && (
            <div className="w-full p-4 rounded-xl bg-[#93000a]/20 border border-[#ffb4ab]/40 text-[#ffb4ab] flex items-center gap-3">
              <span className="material-symbols-outlined text-xl text-[#ffb4ab]">error</span>
              <div className="flex-1">
                <span className="font-semibold block">Analysis Failed</span>
                <span className="text-xs">{errorMessage}</span>
              </div>
              <button
                onClick={() => setErrorMessage(null)}
                className="text-[#ffb4ab] hover:underline text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 4. Telemetry Pipeline Progress Bar (shown when analyzing or completed) */}
          {(pipelineStage !== "idle" || analysisResult) && (
            <TelemetryProgress
              stage={pipelineStage}
              inferenceTime={analysisResult?.inference_time_seconds}
              stageTimings={analysisResult?.stage_timings}
            />
          )}

          {/* 5. Results Section */}
          {analysisResult && (
            <div id="results-section" className="flex flex-col gap-8 scroll-mt-24">
              {/* Primary KPI Result Cards */}
              <ResultsCards data={analysisResult} />

              {/* Interactive Multispectral Crown Viewer */}
              <CrownViewer
                data={analysisResult}
                originalImageUrl={previewUrl}
              />

              {/* Coverage Breakdown & Structural Analytics */}
              <CoverageCharts data={analysisResult} />

              {/* Share & Export Section */}
              <ExportSection data={analysisResult} />
            </div>
          )}

          {/* 6. Scientific Integrity & Limitations Notice */}
          <LimitationsNotice geospatial={analysisResult?.geospatial} />
        </div>
      </main>

      {/* 7. Footer */}
      <Footer />
    </div>
  );
}
