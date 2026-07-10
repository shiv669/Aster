'use client';

import { useState, useRef, useEffect } from "react";
import DatasetUploader from "@/components/ui/file-upload";
import { PreviewTable } from "@/components/preview-table";

export function UploadEngine() {
  const [parsedData, setParsedData] = useState<any>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parsedData && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [parsedData]);

  return (
    <>
      <DatasetUploader onParseSuccess={setParsedData} />
      
      {parsedData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 sm:p-8 animate-in fade-in duration-300">
          <div className="w-full max-w-6xl max-h-[90vh] bg-card border border-border shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-4 sm:p-6 flex-1 overflow-hidden flex flex-col">
              <PreviewTable data={parsedData} onClose={() => setParsedData(null)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
