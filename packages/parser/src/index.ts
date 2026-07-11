import Papa from "papaparse";
import { Engine, EngineResult } from "@aster/shared";

export interface ParserInput {
  buffer: Buffer;
}

export interface ParserOutput {
  headers: string[];
  records: Record<string, string>[];
  rowCount: number;
  delimiter: string;
}

export class ParserEngine implements Engine<ParserInput, ParserOutput> {
  readonly name = "ParserEngine";
  readonly version = "1.0.0";

  async execute(input: ParserInput): Promise<EngineResult<ParserOutput>> {
    const start = Date.now();
    return new Promise((resolve) => {
      let csvString = "";

      // Invisible Feature 1: Automatic Encoding Recovery
      // Check for UTF-16 LE BOM (FF FE) or UTF-16 BE BOM (FE FF)
      // or simply look for null bytes which indicate UTF-16 for standard ASCII characters
      if (
        (input.buffer[0] === 0xFF && input.buffer[1] === 0xFE) ||
        (input.buffer[0] === 0xFE && input.buffer[1] === 0xFF) ||
        input.buffer.includes(0x00)
      ) {
        csvString = input.buffer.toString("utf16le");
      } else {
        csvString = input.buffer.toString("utf8");
      }

      const records: Record<string, string>[] = [];
      let headers: string[] = [];
      let delimiter = ",";

      let headerIdx = 0;

      Papa.parse(csvString, {
        header: true,
        skipEmptyLines: "greedy",
        // Invisible Feature 2: PapaParse handles delimiter detection automatically when undefined
        // Invisible Feature 3: Header Recovery
        transformHeader: (header) => {
          let clean = header.trim().replace(/^["']|["']$/g, "");
          if (!clean) {
            clean = `Unknown_Column_${headerIdx}`;
          }
          headerIdx++;
          return clean;
        },
        step: (results) => {
          if (headers.length === 0 && results.meta.fields) {
            headers = results.meta.fields;
            delimiter = results.meta.delimiter;
          }
          if (results.data) {
            records.push(results.data as Record<string, string>);
          }
        },
        complete: () => {
          resolve({
            success: true,
            output: {
              headers,
              records,
              rowCount: records.length,
              delimiter,
            },
            duration: Date.now() - start,
          });
        },
        error: (error: Error) => {
          resolve({
            success: false,
            output: { headers: [], records: [], rowCount: 0, delimiter: "," },
            warnings: [error.message],
            duration: Date.now() - start,
          });
        },
      });
    });
  }
}
