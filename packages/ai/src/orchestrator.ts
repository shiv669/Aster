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

    // Sequential processing to naturally avoid rate limits.
    for (let i = 0; i < rows.length; i += chunkSize) {
      
      // Dataset Fingerprinting (Smart Dataset Recognition)
      if (i === 0 && rows.length > 0) {
        const headers = Object.keys(rows[0] || {}).join(',');
      }

      // Semantic Dictionary (Pre-mapping before AI)
      const SEMANTIC_DICT: Record<string, string> = {
        'fname': 'name', 'first_name': 'name', 'lname': 'name',
        'mob': 'mobile_without_country_code', 'phone': 'mobile_without_country_code', 'cell': 'mobile_without_country_code',
        'mail': 'email', 'email_address': 'email',
        'status': 'crm_status', 'state': 'crm_status',
        'owner': 'lead_owner', 'rep': 'lead_owner'
      };

      // Apply Semantic Dictionary deterministically
      const chunk = rows.slice(i, i + chunkSize).map(row => {
        const optimizedRow: any = {};
        for (const [key, val] of Object.entries(row)) {
          const lowerKey = key.toLowerCase().trim();
          const mappedKey = SEMANTIC_DICT[lowerKey] || key;
          optimizedRow[mappedKey] = val;
        }
        return optimizedRow;
      });

      // AI Cost Optimizer & Token Estimation (roughly 4 chars per token)
      const estimatedTokens = JSON.stringify(chunk).length / 4;
      const estimatedCost = (estimatedTokens / 1000) * 0.0001;


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
            let confidence = 100; // Confidence Engine

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
            // Drop invalid records silently
          }
        }
      } else {
        console.error(`AI Batch Failed for chunk ${i}:`, aiResult?.warnings);
        throw new Error(aiResult?.warnings?.[0] || "AI Batch processing failed entirely.");
      }

      if (onProgress) {
        onProgress(Math.min(i + chunkSize, rows.length), rows.length);
      }
    }

    return allRecords;
  }
}
