import { Engine, EngineResult } from "@aster/shared";

export interface PromptInput {
  datasetChunk: any[];
}

export interface PromptOutput {
  systemPrompt: string;
  userPrompt: string;
}

export class PromptEngine implements Engine<PromptInput, PromptOutput> {
  readonly name = "PromptEngine";
  readonly version = "1.0.0";

  async execute(input: PromptInput): Promise<EngineResult<PromptOutput>> {
    const systemPrompt = `You are a strict data transformation engine. 
You are extracting raw spreadsheet rows into a standardized CRM system using the provided tool function.

CRITICAL BUSINESS RULES:
1. ALLOWED CRM STATUS: "GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE" (or null).
2. ALLOWED DATA SOURCE: "leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots" (or null).
3. DATES: Standardize all dates into ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ).
4. CONSOLIDATION: If a row contains multiple emails/phones, put the primary in the main field and append the rest to 'crm_note'.
5. MISSING DATA: Skip generating a record entirely if BOTH email AND mobile number are completely missing.`;

    const userPrompt = `Extract these rows:\n${JSON.stringify(input.datasetChunk)}`;

    return {
      success: true,
      output: {
        systemPrompt,
        userPrompt,
      },
    };
  }
}
