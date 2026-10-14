import { z } from "zod";
import { climateInputSchema } from "./climate";

export const projectTypes = [
  "bike-lane",
  "bus-priority",
  "pedestrian",
] as const;
export const projectTypeSchema = z.enum(projectTypes);
export type ProjectType = z.infer<typeof projectTypeSchema>;
export const evidenceSchema = z.object({
  field: z.string(),
  quote: z.string(),
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
});
export const proposalSchema = z.object({
  title: z.string().min(1).max(180),
  type: projectTypeSchema.nullable(),
  location: z.string().max(240).nullable(),
  distanceMiles: z.number().positive().max(1000).nullable(),
  crossingCount: z.number().int().positive().max(10000).nullable(),
  budget: z.number().nonnegative().max(1e12).nullable(),
  changes: z.array(z.string().max(600)).max(30),
  objectives: z.array(z.string().max(600)).max(30),
  missing: z.array(z.string()).max(30),
  evidence: z.array(evidenceSchema).max(60),
  sourceText: z.string().max(30000),
});
export type Proposal = z.infer<typeof proposalSchema>;
export const assumptionsSchema = z
  .object({
    capitalPerUnit: z.number().positive().max(1e9),
    alternativeCapitalPerUnit: z.number().positive().max(1e9),
    annualMaintenancePerUnit: z.number().nonnegative().max(1e8),
    alternativeAnnualMaintenancePerUnit: z.number().nonnegative().max(1e8),
    designPercent: z.number().min(0).max(100),
    contingencyPercent: z.number().min(0).max(100),
    sensitivityPercent: z.number().min(0).max(90),
    horizonYears: z.number().int().min(1).max(50),
  })
  .refine((a) => a.alternativeCapitalPerUnit <= a.capitalPerUnit, {
    message:
      "The lower-cost alternative unit cost must not exceed the proposed unit cost.",
    path: ["alternativeCapitalPerUnit"],
  });
export type Assumptions = z.infer<typeof assumptionsSchema>;
export const analysisInputSchema = z.object({
  proposal: proposalSchema,
  assumptions: assumptionsSchema,
  assumptionBasis: z.enum(["illustrative", "user"]),
  illustrativeAccepted: z.boolean(),
  climate: climateInputSchema.optional(),
});
export type AnalysisInput = z.infer<typeof analysisInputSchema>;
export type ScenarioId = "baseline" | "proposed" | "alternative";
export interface Scenario {
  id: ScenarioId;
  name: string;
  description: string;
  capitalCost: number;
  annualMaintenance: number;
  lifecycleCost: number;
  capitalLow: number;
  capitalHigh: number;
  maintenanceLow: number;
  maintenanceHigh: number;
  constructionCost: number;
  designCost: number;
  contingencyCost: number;
  tradeoffs: {
    access: string;
    safety: string;
    operations: string;
    delivery: string;
  };
}
export interface AnalysisResult {
  modelVersion: string;
  generatedAt: string;
  input: AnalysisInput;
  quantity: number;
  unit: "corridor mile" | "crossing";
  scenarios: Scenario[];
  limitations: string[];
  followUp: string[];
  summary: string;
  sources: { title: string; url: string }[];
}
export interface ExtractionResult {
  proposal: Proposal;
  mode: "demo" | "ai";
  warning?: string;
  provider?: string;
}
