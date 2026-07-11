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
  ): Promise<any[]> {
    const allRecords: any[] = [];
    const duplicateTracker = new Set<string>(); // Native Set for Duplicate Engine

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
        // MILESTONE 4/6: Validation, Repair, Confidence & Duplicates
        for (const rawRecord of aiResult.output) {
          const parsed = crmRecordSchema.safeParse(rawRecord);

          if (parsed.success) {
            const rec = parsed.data;
            let confidence = 100; // YAGNI: Confidence Engine

            // 1. Data Preparation Engine & Deterministic Repair
            if (rec.email) rec.email = rec.email.trim().toLowerCase();
            if (rec.mobile_without_country_code) {
              rec.mobile_without_country_code = rec.mobile_without_country_code.replace(/\D/g, '');
            }
            if (rec.country_code && !rec.country_code.startsWith('+')) {
              rec.country_code = `+${rec.country_code.replace(/\D/g, '')}`; // repair country code
            }

            // 2. Critical Business Rule Enforcer
            if (!rec.email && !rec.mobile_without_country_code) {
              console.warn("Milestone 4: Dropped record - missing both email and mobile.");
              continue; // Skip this record
            }

            // 3. Duplicate Engine (Memory Set Check)
            const identifier = rec.email || rec.mobile_without_country_code;
            if (identifier && duplicateTracker.has(identifier)) {
              confidence -= 50; // Flag as potential duplicate
              rec.crm_note = `[DUPLICATE] ${rec.crm_note || ''}`.trim();
            } else if (identifier) {
              duplicateTracker.add(identifier);
            }

            // 4. Confidence Penalty for missing critical fields
            if (!rec.name) confidence -= 10;
            if (!rec.lead_owner) confidence -= 10;
            if (!rec.crm_status) confidence -= 5;

            allRecords.push({ ...rec, aster_confidence: `${Math.max(0, confidence)}%` });
          } else {
            console.warn("Milestone 4: Dropped record - Zod schema validation failed.", parsed.error.issues);
          }
        }
      } else {
        console.error(`AI Batch Failed for chunk ${i}:`, aiResult?.warnings);
      }

      if (onProgress) {
        onProgress(Math.min(i + chunkSize, rows.length), rows.length);
      }
    }

    return allRecords;
  }
}
