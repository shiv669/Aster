import { Engine, EngineResult } from "@aster/shared";

export interface PromptInput {
  datasetChunk: any[]; // The raw JSON rows from PapaParse
}

export interface PromptOutput {
  systemPrompt: string;
  userPrompt: string;
}

export class PromptEngine implements Engine<PromptInput, PromptOutput> {
  readonly name = "PromptEngine";
  readonly version = "1.0.0";

  async execute(input: PromptInput): Promise<EngineResult<PromptOutput>> {
    const systemPrompt = `You are a strict deterministic data transformation engine. 
Your ONLY purpose is to transform the provided raw dataset rows into a strict JSON object containing a 'records' array of CRM records.

CRITICAL RULES:
1. OUTPUT FORMAT: You must output exactly one JSON object with a single key "records" containing the array of transformed objects. NO markdown, NO conversational text.
2. SCHEMA: Every object in the array must adhere strictly to the CRM Record format. 
   Keys allowed: created_at, name, email, country_code, mobile_without_country_code, company, city, state, country, lead_owner, crm_status, crm_note, data_source, possession_time, description.
3. ALLOWED CRM STATUS: You may ONLY use one of the following exact strings (or null): "GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE".
4. ALLOWED DATA SOURCE: You may ONLY use one of the following exact strings (or null): "leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots".
5. DATES: Standardize all dates into ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ) in the 'created_at' or 'possession_time' fields.
6. CONSOLIDATION: If a row contains multiple emails or multiple phone numbers, place the primary one in 'email' / 'mobile_without_country_code' and append the extras into the 'crm_note' field as a readable string.
7. MISSING DATA: If an email or mobile number is completely missing, skip generating a record for that row entirely.

Transform the incoming raw rows based on the above logic.`;

    const userPrompt = `Transform the following raw dataset chunk into the target JSON object.
RAW DATA CHUNK:
${JSON.stringify(input.datasetChunk, null, 2)}
    
OUTPUT ONLY JSON OBJECT WITH 'records' ARRAY:`;

    return {
      success: true,
      output: {
        systemPrompt,
        userPrompt,
      },
    };
  }
}
