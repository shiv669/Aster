'use client';

import { useState, useRef, useEffect } from "react";
import DatasetUploader from "@/components/ui/file-upload";
import { PreviewTable } from "@/components/preview-table";
import { SlideButton } from "@/components/ui/slide-button";

export function UploadEngine() {
  const [parsedData, setParsedData] = useState<any>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);

  const handleSlide = async () => {
    if (!activeFile) return;
    setIsProcessing(true);
    setProcessingProgress(0);
    console.log("Triggering AI processing for dataset...");
    
    try {
      const formData = new FormData();
      formData.append('file', activeFile);
      
      const res = await fetch('/api/process', {
        method: 'POST',
        body: formData
      });
      
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let done = false;
        let buffer = '';
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            buffer += decoder.decode(value, { stream: !done });
            const parts = buffer.split('\n\n');
            buffer = parts.pop() || ''; // Keep the incomplete chunk in the buffer
            
            for (const line of parts) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.substring(6));
                  if (data.type === 'progress') {
                    setProcessingProgress(Math.round((data.processed / data.total) * 100));
                  } else if (data.type === 'complete') {
                    setProcessResult(data.data);
                  } else if (data.type === 'error') {
                    console.error("AI stream error:", data.error);
                  }
                } catch (e) {
                  console.error("Failed to parse chunk line:", line, e);
                }
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to process dataset", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <DatasetUploader onParseSuccess={(data, file) => {
        setParsedData(data);
        if (file) setActiveFile(file);
      }} />
      
      {parsedData && (
        <div className="fixed inset-0 z-[40] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-6xl max-h-[80vh] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col">
              <PreviewTable data={parsedData} onClose={() => setParsedData(null)} />
            </div>
          </div>
        </div>
      )}

      {/* The Premium Slide-to-Upload Footer */}
      {parsedData && !processResult && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-background/95 backdrop-blur-xl shadow-2xl border border-border rounded-full p-2 pr-6 flex items-center gap-4 relative overflow-hidden">
            {/* Progress Background Fill */}
            {isProcessing && (
              <div 
                className="absolute inset-0 bg-primary/10 transition-all duration-300 ease-out z-0" 
                style={{ width: `${processingProgress}%` }} 
              />
            )}
            
            <div className="relative z-10 flex items-center gap-4">
              <SlideButton onSlide={handleSlide} />
              <span className="text-sm font-medium text-muted-foreground pr-2 min-w-[200px]">
                {isProcessing 
                  ? `Processing chunk... ${processingProgress}%` 
                  : "Slide to run Intelligence Engine"
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Render the final AI output */}
      {processResult && (
        <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-background p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-4xl text-center space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">AI Transformation Complete</h2>
            <p className="text-muted-foreground">The Intelligence Engine has structured your dataset.</p>
            <div className="bg-card text-left border rounded-xl overflow-auto h-[60vh] p-4 text-xs font-mono shadow-inner">
              <pre>{JSON.stringify(processResult, null, 2)}</pre>
            </div>
            <button 
              className="px-6 py-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors"
              onClick={() => { setProcessResult(null); setParsedData(null); setActiveFile(null); }}
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </>
  );
}
