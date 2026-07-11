import { Engine, EngineResult, CRMRecord } from "@aster/shared";
import Groq from "groq-sdk";
export { BatchOrchestrator } from "./orchestrator";

export interface IntelligenceInput {
  systemPrompt: string;
  userPrompt: string;
}

export class IntelligenceEngine implements Engine<IntelligenceInput, CRMRecord[]> {
  readonly name = "IntelligenceEngine";
  readonly version = "1.0.0";
  private groq: Groq;

  constructor(apiKey: string) {
    this.groq = new Groq({ apiKey });
  }

  async execute(input: IntelligenceInput): Promise<EngineResult<CRMRecord[]>> {
    const startTime = Date.now();
    try {
      const completion = await this.groq.chat.completions.create({
        messages: [
          { role: "system", content: input.systemPrompt },
          { role: "user", content: input.userPrompt }
        ],
        model: "llama-3.3-70b-versatile", // High capacity, highly deterministic modern model
        temperature: 0.0,
        max_tokens: 4000,
        tools: [{
          type: "function",
          function: {
            name: "extract_crm_records",
            description: "Extract the raw rows into CRM records",
            parameters: {
              type: "object",
              properties: {
                records: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      created_at: { type: ["string", "null"] },
                      name: { type: ["string", "null"] },
                      email: { type: ["string", "null"] },
                      country_code: { type: ["string", "null"] },
                      mobile_without_country_code: { type: ["string", "null"] },
                      company: { type: ["string", "null"] },
                      city: { type: ["string", "null"] },
                      state: { type: ["string", "null"] },
                      country: { type: ["string", "null"] },
                      lead_owner: { type: ["string", "null"] },
                      crm_status: { type: ["string", "null"] },
                      crm_note: { type: ["string", "null"] },
                      data_source: { type: ["string", "null"] },
                      possession_time: { type: ["string", "null"] },
                      description: { type: ["string", "null"] }
                    }
                  }
                }
              },
              required: ["records"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_crm_records" } } as any
      });

      const toolCall = completion.choices[0]?.message?.tool_calls?.[0];
      if (!toolCall || !toolCall.function || !toolCall.function.arguments) {
        throw new Error("Model failed to call the extraction tool");
      }
      
      const parsed = JSON.parse(toolCall.function.arguments);
      const outputRecords = parsed.records || [];

      return {
        success: true,
        output: outputRecords as CRMRecord[],
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        success: false,
        output: [],
        warnings: [error.message],
        duration: Date.now() - startTime
      };
    }
  }
}
