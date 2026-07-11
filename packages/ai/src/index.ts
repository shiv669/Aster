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
        model: "llama3-70b-8192", // High capacity, highly deterministic model
        temperature: 0.0,
        max_tokens: 4000,
        response_format: { type: "json_object" } 
      });

      const responseContent = completion.choices[0]?.message?.content || "{}";
      
      let parsed = JSON.parse(responseContent);
      
      // If the LLM wraps the array in an object (required by json_object format)
      if (!Array.isArray(parsed)) {
        const keys = Object.keys(parsed);
        if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
           parsed = parsed[keys[0]];
        } else if (parsed.records && Array.isArray(parsed.records)) {
           parsed = parsed.records;
        } else {
           // Best effort fallback
           parsed = Object.values(parsed).find(Array.isArray) || [];
        }
      }

      return {
        success: true,
        output: parsed as CRMRecord[],
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
