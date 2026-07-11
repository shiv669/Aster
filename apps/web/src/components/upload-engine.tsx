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
  
  // Storage for processed files
  const [cleanedFileObjects, setCleanedFileObjects] = useState<File[]>([]);
  const [activeTab, setActiveTab] = useState<'raw'|'cleaned'>('raw');
  
  // YAGNI: State Machine for ImportSession
  const [importState, setImportState] = useState<'CREATED' | 'UPLOADING' | 'ANALYZING' | 'SCHEMA_READY' | 'PROCESSING' | 'VALIDATING' | 'REPAIRING' | 'COMPLETED' | 'FAILED'>('CREATED');
  
  // Developer Inspector State
  const [showInspector, setShowInspector] = useState(false);

  // Hidden Keyboard Shortcut (Ctrl+Shift+D)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowInspector(prev => !prev);
      }
    };
    
    // Prevent browser from downloading files when dropped outside the dropzone
    const handleDragOver = (e: DragEvent) => e.preventDefault();
    const handleDrop = (e: DragEvent) => e.preventDefault();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);


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
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:4000' : '');
      const response = await fetch(`${API_BASE}/api/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsedData?.records || [] }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setImportState('VALIDATING');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');

      if (!reader) throw new Error("No reader available");

      let finalResult = null;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;

            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'progress') {
                setProcessingProgress(Math.round((data.processed / data.total) * 100));
              } else if (data.type === 'complete') {
                setImportState('REPAIRING');
                finalResult = data.result;
                setProcessResult(data.result);
              } else if (data.type === 'error') {
                setImportState('FAILED');
                throw new Error(data.message);
              }
            } catch (e) {
              console.error("Error parsing SSE JSON:", e);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to process dataset", err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full relative">
      {/* Developer Inspector Panel */}
      {showInspector && (
        <div className="fixed top-4 right-4 z-[100] w-80 bg-zinc-950 text-emerald-400 font-mono text-xs p-4 rounded-lg shadow-2xl border border-zinc-800 animate-in slide-in-from-right-8">
          <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
            <span className="font-bold">DEVELOPER INSPECTOR</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between"><span>State:</span><span className="text-white">{importState}</span></div>
            <div className="flex justify-between"><span>Rows:</span><span className="text-white">{parsedData?.records?.length || 0}</span></div>
            <div className="flex justify-between"><span>Memory:</span><span className="text-white">~{(performance as any)?.memory?.usedJSHeapSize ? Math.round((performance as any).memory.usedJSHeapSize / 1048576) + ' MB' : 'N/A'}</span></div>
            {processResult && (
               <div className="flex justify-between"><span>Processed:</span><span className="text-white">{processResult.length}</span></div>
            )}
          </div>
          <div className="mt-4 text-zinc-500 text-[10px]">Press Ctrl+Shift+D to close</div>
        </div>
      )}

      {/* Tab Slider for switching contexts */}
      <div className="flex justify-center mb-8">
        <div className="bg-muted/50 p-1 rounded-xl inline-flex shadow-sm border border-border">
          <button 
            onClick={() => setActiveTab('raw')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'raw' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Uploaded Files
          </button>
          <button 
            onClick={() => setActiveTab('cleaned')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'cleaned' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            Cleaned Files
          </button>
        </div>
      </div>

      <div className={activeTab === 'raw' ? 'block' : 'hidden'}>
        <DatasetUploader onParseSuccess={(data, file) => {
          setParsedData(data);
          if (file) setActiveFile(file);
        }} />
      </div>

      <div className={activeTab === 'cleaned' ? 'block' : 'hidden'}>
        <DatasetUploader 
          key={cleanedFileObjects.length} 
          initialFiles={cleanedFileObjects} 
          hideUploadZone={true} 
        />
      </div>


      
      {parsedData && (
        <div className="fixed inset-0 z-[40] flex items-center justify-center bg-background p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-6xl max-h-[80vh] bg-card border border-border shadow-sm rounded-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col">
              <PreviewTable data={parsedData} onClose={() => setParsedData(null)} />
            </div>
          </div>
        </div>
      )}

      {/* Slide-to-Upload Footer */}
      {parsedData && !processResult && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-card shadow-sm border border-border rounded-full p-2 pr-6 flex items-center gap-4 relative overflow-hidden">
            <div className="relative z-10 flex items-center gap-4">
              <SlideButton onSlide={handleSlide} />
              <span className="text-sm font-medium text-muted-foreground pr-2 min-w-[200px]">
                {isProcessing 
                  ? `Processing chunk... ${processingProgress}%` 
                  : "Slide to process dataset"
                }
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Render the final AI output Dashboard */}
      {processResult && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-background p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="w-full h-full max-w-7xl bg-card border border-border shadow-sm rounded-xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 shrink-0 border-b border-border bg-card">
              <div>
                <h3 className="text-xl font-semibold tracking-tight flex items-center gap-3">
                  Processed Results
                  <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2.5 py-1 rounded-md font-medium border border-emerald-500/20">
                    {processResult.length} Imported
                  </span>
                  <span className="bg-amber-500/10 text-amber-500 text-xs px-2.5 py-1 rounded-md font-medium border border-amber-500/20">
                    {parsedData?.records?.length ? parsedData.records.length - processResult.length : 0} Skipped
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground mt-1.5">
                  Successfully extracted {processResult.length} CRM records. {parsedData?.records?.length ? parsedData.records.length - processResult.length : 0} invalid records were skipped.
                </p>
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
                  onClick={() => { 
                    if (processResult && activeFile) {
                      const headers = Object.keys(processResult[0] || {});
                      const csvContent = [
                        headers.join(','),
                        ...processResult.map((row: any) => 
                          headers.map(field => JSON.stringify(row[field] || "")).join(',')
                        )
                      ].join('\n');
                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                      const file = new File([blob], `cleaned_${activeFile.name}`, { type: 'text/csv' });
                      setCleanedFileObjects(prev => [...prev, file]);
                    }
                    setProcessResult(null); 
                    setParsedData(null); 
                    setActiveFile(null); 
                  }}
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
    </div>
  );
}
