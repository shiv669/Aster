import { CRMRecord } from "@aster/shared";
import { IntelligenceEngine } from "./index";
import { PromptEngine } from "@aster/prompts";

export class BatchOrchestrator {
  private aiEngine: IntelligenceEngine;
  private promptEngine: PromptEngine;

  constructor(apiKey: string) {
    this.aiEngine = new IntelligenceEngine(apiKey);
    this.promptEngine = new PromptEngine();
  }

  async processDataset(
    rows: any[], 
    chunkSize: number = 10,
    onProgress?: (processedCount: number, totalCount: number) => void
  ): Promise<CRMRecord[]> {
    const allRecords: CRMRecord[] = [];
    
    // YAGNI: Sequential processing to naturally avoid rate limits. No complex queue needed yet.
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      
      const promptResult = await this.promptEngine.execute({ datasetChunk: chunk });
      if (!promptResult.success) continue;

      const aiResult = await this.aiEngine.execute(promptResult.output);
      if (aiResult.success && aiResult.output) {
        allRecords.push(...aiResult.output);
      } else {
        console.error(`AI Batch Failed for chunk ${i}:`, aiResult.warnings);
      }

      if (onProgress) {
        onProgress(Math.min(i + chunkSize, rows.length), rows.length);
      }
    }

    return allRecords;
  }
}
