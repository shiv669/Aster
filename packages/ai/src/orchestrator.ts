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

  async processDataset(rows: any[], chunkSize: number = 10): Promise<CRMRecord[]> {
    const allRecords: CRMRecord[] = [];
    
    // Chunking the dataset
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      
      const promptResult = await this.promptEngine.execute({ datasetChunk: chunk });
      if (!promptResult.success) continue;

      const aiResult = await this.aiEngine.execute(promptResult.output);
      if (aiResult.success && aiResult.output) {
        allRecords.push(...aiResult.output);
      }
    }

    return allRecords;
  }
}
