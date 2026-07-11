'use client';

import { useState, useRef, useEffect } from "react";
import DatasetUploader from "@/components/ui/file-upload";
import { PreviewTable } from "@/components/preview-table";
import { SlideButton } from "@/components/ui/slide-button";

export function UploadEngine() {
  const [parsedData, setParsedData] = useState<any>(null);

  const handleSlide = async () => {
    if (!parsedData) return;
    console.log("Triggering AI processing for dataset...");
    // Simulate AI network delay for now
    await new Promise((resolve) => setTimeout(resolve, 2500));
    // Implementation of real API call will go here
  };

  return (
    <>
      <DatasetUploader onParseSuccess={setParsedData} />
      
      {parsedData && (
        <div className="fixed inset-0 z-[40] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-6xl max-h-[80vh] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col">
              <PreviewTable data={parsedData} onClose={() => setParsedData(null)} />
            </div>
          </div>
        </div>
      )}

      {/* The Premium Slide-to-Upload Footer (only visible when data is ready) */}
      {parsedData && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-background/95 backdrop-blur-xl shadow-2xl border border-border rounded-full p-2 pr-6 flex items-center gap-4">
            <SlideButton onSlide={handleSlide} />
            <span className="text-sm font-medium text-muted-foreground pr-2">
              Slide to run Intelligence Engine
            </span>
          </div>
        </div>
      )}
    </>
  );
}
