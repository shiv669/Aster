import Papa from "papaparse";
import { Engine, EngineResult } from "@aster/shared";
import { Readable } from "stream";

export interface ParserInput {
  stream: Readable;
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
      const records: Record<string, string>[] = [];
      let headers: string[] = [];
      let delimiter = ",";

      Papa.parse(input.stream, {
        header: true,
        skipEmptyLines: "greedy",
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
        }
      });
    });
  }
}
