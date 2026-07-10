import React from 'react';
import { XIcon } from 'lucide-react';

export function PreviewTable({ data, onClose }: { data: any, onClose?: () => void }) {
  if (!data || !data.metadata || !data.previewRows) return null;

  const { headers, rowCount } = data.metadata;
  const rows = data.previewRows;

  return (
    <div className="w-full h-full flex flex-col space-y-4 overflow-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h3 className="text-xl font-semibold tracking-tight flex items-center gap-3">
            Dataset Preview
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
              {rows.length} of {rowCount} rows
            </span>
          </h3>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-2 bg-muted/50 hover:bg-muted rounded-full transition-colors group">
            <XIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
          </button>
        )}
      </div>
      
      <div className="rounded-xl border border-border bg-card shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto relative scrollbar-thin">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3 font-medium border-b border-r border-border bg-muted/95 backdrop-blur shadow-sm w-12 text-center">#</th>
                {headers.map((header: string, idx: number) => (
                  <th key={idx} className="px-4 py-3 font-medium border-b border-border bg-muted/95 backdrop-blur shadow-sm whitespace-nowrap min-w-[150px]">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row: any, i: number) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-2 font-medium text-muted-foreground border-r border-border whitespace-nowrap bg-muted/10">
                    {i + 1}
                  </td>
                  {headers.map((header: string, idx: number) => (
                    <td key={idx} className="px-4 py-2 break-words min-w-[150px]" title={row[header] || ''}>
                      {row[header] || <span className="text-muted-foreground/40 italic">empty</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
