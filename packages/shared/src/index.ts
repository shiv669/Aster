import { z } from "zod";

// --- Enums (Domain Constants) ---
export const LeadStatus = {
  GOOD_LEAD_FOLLOW_UP: "GOOD_LEAD_FOLLOW_UP",
  DID_NOT_CONNECT: "DID_NOT_CONNECT",
  BAD_LEAD: "BAD_LEAD",
  SALE_DONE: "SALE_DONE",
} as const;

export const DataSource = {
  LEADS_ON_DEMAND: "leads_on_demand",
  MERIDIAN_TOWER: "meridian_tower",
  EDEN_PARK: "eden_park",
  VARAH_SWAMY: "varah_swamy",
  SARJAPUR_PLOTS: "sarjapur_plots",
} as const;

// --- Zod CRM Schema ---
export const crmRecordSchema = z.object({
  created_at: z.string().datetime().optional().nullable(),
  name: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  country_code: z.string().optional().nullable(),
  mobile_without_country_code: z.string().optional().nullable(),
  company: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  lead_owner: z.string().email().optional().nullable(),
  crm_status: z.nativeEnum(LeadStatus).optional().nullable(),
  crm_note: z.string().optional().nullable(),
  data_source: z.nativeEnum(DataSource).optional().nullable(),
  possession_time: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export type CRMRecord = z.infer<typeof crmRecordSchema>;

// --- Engine Architecture Interfaces ---
export interface EngineResult<T> {
  success: boolean;
  output: T;
  metrics?: Record<string, unknown>;
  warnings?: string[];
  duration?: number;
}

export interface Engine<Input, Output> {
  readonly name: string;
  readonly version: string;
  execute(input: Input): Promise<EngineResult<Output>>;
}
