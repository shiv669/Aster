import { CRMRecord, crmRecordSchema } from "@aster/shared";
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
    
    // YAGNI: Sequential processing to naturally avoid rate limits.
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      
      const promptResult = await this.promptEngine.execute({ datasetChunk: chunk });
      if (!promptResult.success) continue;

      let aiResult;
      let retries = 0;
      const MAX_RETRIES = 2;

      while (retries <= MAX_RETRIES) {
        aiResult = await this.aiEngine.execute(promptResult.output);
        if (aiResult.success) break;
        
        retries++;
        if (retries <= MAX_RETRIES) {
          console.warn(`Milestone 6: AI Batch Failed. Retrying ${retries}/${MAX_RETRIES}...`);
          await new Promise(r => setTimeout(r, 1500)); // wait before retry
        }
      }
      
      if (aiResult && aiResult.success && aiResult.output) {
        // MILESTONE 4: Validation & Repair (Trusted Data)
        for (const rawRecord of aiResult.output) {
          const parsed = crmRecordSchema.safeParse(rawRecord);
          
          if (parsed.success) {
            const rec = parsed.data;
            
            // 1. Deterministic Repair
            if (rec.email) rec.email = rec.email.trim().toLowerCase();
            if (rec.mobile_without_country_code) {
               // Strip all non-digit characters from the phone number
               rec.mobile_without_country_code = rec.mobile_without_country_code.replace(/\D/g, '');
            }

            // 2. Critical Business Rule Enforcer
            if (!rec.email && !rec.mobile_without_country_code) {
              console.warn("Milestone 4: Dropped record - missing both email and mobile.");
              continue; // Skip this record
            }

            allRecords.push(rec);
          } else {
            console.warn("Milestone 4: Dropped record - Zod schema validation failed.", parsed.error.issues);
          }
        }
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
