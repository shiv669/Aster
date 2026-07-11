'use client';

import { useState, useRef, useEffect } from "react";
import DatasetUploader from "@/components/ui/file-upload";
import { PreviewTable } from "@/components/preview-table";
import { SlideButton } from "@/components/ui/slide-button";

import { DownloadIcon, RefreshCwIcon } from "lucide-react";

export function UploadEngine() {
  const [parsedData, setParsedData] = useState<any>(null);
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);
  const [processingProgress, setProcessingProgress] = useState<number>(0);

  const downloadCSV = () => {
    if (!processResult || processResult.length === 0) return;
    const headers = Object.keys(processResult[0]);
    const csvContent = [
      headers.join(','),
      ...processResult.map((row: any) => 
        headers.map(field => JSON.stringify(row[field] || "")).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `aster_cleaned_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

      {/* Render the final AI output Dashboard */}
      {processResult && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 backdrop-blur-md p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="w-full h-full max-w-7xl bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-5 shrink-0 border-b border-border bg-background">
              <div>
                <h3 className="text-xl font-semibold tracking-tight flex items-center gap-3">
                  AI Processed Results
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                    {processResult.length} Extracted
                  </span>
                  {parsedData?.metadata?.rowCount && (parsedData.metadata.rowCount > processResult.length) && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
                      {parsedData.metadata.rowCount - processResult.length} Dropped
                    </span>
                  )}
                </h3>
              </div>
              
              <div className="flex items-center gap-2 mt-4 sm:mt-0">
                <button 
                  onClick={downloadCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  Export CSV
                </button>
                <button 
                  onClick={() => { setProcessResult(null); setParsedData(null); setActiveFile(null); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-muted-foreground text-xs font-medium rounded-md hover:bg-muted/80 transition-colors border border-border"
                >
                  <RefreshCwIcon className="w-3.5 h-3.5" />
                  Start Over
                </button>
              </div>
            </div>

            {/* Table Section */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col bg-background">
              <div className="rounded-xl border border-border bg-card shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 overflow-auto relative scrollbar-thin">
                  <table className="w-full text-sm text-left border-collapse">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 font-medium border-b border-r border-border bg-muted/95 backdrop-blur shadow-sm w-12 text-center">#</th>
                        {Object.keys(processResult[0] || {}).map(key => (
                          <th key={key} className="px-4 py-3 font-medium border-b border-border bg-muted/95 backdrop-blur shadow-sm whitespace-nowrap min-w-[150px]">
                            {key.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {processResult.map((row: any, i: number) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2 font-medium text-muted-foreground border-r border-border whitespace-nowrap bg-muted/10">
                            {i + 1}
                          </td>
                          {Object.keys(processResult[0] || {}).map(key => (
                            <td key={key} className="px-4 py-2 break-words min-w-[150px]" title={row[key] || ''}>
                              {row[key] || <span className="text-muted-foreground/40 italic">empty</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
