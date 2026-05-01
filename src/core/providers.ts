import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { getPaths } from "./paths.js";

/**
 * Use-case identifiers for the recommender. The order in `useCases` matters:
 * the first entry is treated as the model's PRIMARY use case (rank 2),
 * subsequent entries are SECONDARY (rank 1). See `recommender.ts`.
 */
export const USE_CASES = [
  "coding-fast",
  "refactor",
  "long-context",
  "cheap-agent",
  "vision",
  "multi-agent",
  "free-trial",
  "cheap-batch",
] as const;
export type UseCase = (typeof USE_CASES)[number];

const PricingSchema = z.union([
  z.null(),
  z.object({
    inputPer1M: z.number(),
    outputPer1M: z.number(),
    trial: z.boolean().optional(),
  }),
]);

const ModelSchema = z.object({
  id: z.string(),
  role: z.enum(["main", "small"]),
  free: z.boolean(),
  context: z.number().optional(),
  note: z.string().optional(),
  // v0.2 additions — optional + defaulted so v0.1 providers.user.json keeps parsing.
  useCases: z.array(z.string()).optional().default([]),
  pricing: PricingSchema.optional().default(null),
});

const InstructionsSchema = z.object({
  tr: z.string(),
  en: z.string(),
});

const AuthSchema = z.object({
  envVar: z.string(),
  keyUrl: z.string().url(),
  needsKey: z.boolean(),
  instructions: InstructionsSchema,
});

const ProviderSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  tier: z.enum(["free", "trial", "paid"]),
  trialEndsAt: z.string().nullable().optional(),
  baseUrl: z.string().url().nullable(),
  envStyle: z.literal("anthropic"),
  auth: AuthSchema,
  models: z.array(ModelSchema),
  defaults: z.object({
    main: z.string().nullable(),
    small: z.string().nullable(),
  }),
  notes: InstructionsSchema,
  lastVerified: z.string(),
});

const RegistrySchema = z.object({
  schemaVersion: z.literal(1),
  lastUpdated: z.string(),
  providers: z.array(ProviderSchema),
});

export type Provider = z.infer<typeof ProviderSchema>;
export type Model = z.infer<typeof ModelSchema>;
export type Registry = z.infer<typeof RegistrySchema>;

function bundledPath(): string {
  // dist/cli.js is the built entry; templates are copied next to it via tsup publicDir.
  // src/core/providers.ts at runtime: when run from dist, __filename is dist/cli.js — try both.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.join(here, "providers.json"),
    path.join(here, "..", "templates", "providers.json"),
    path.join(here, "..", "..", "src", "templates", "providers.json"),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  throw new Error(
    `claudex: bundled providers.json not found. Looked in:\n${candidates.join("\n")}`
  );
}

export function loadRegistry(): Registry {
  const bundledRaw = JSON.parse(fs.readFileSync(bundledPath(), "utf8"));
  const bundled = RegistrySchema.parse(bundledRaw);

  const { userProvidersFile } = getPaths();
  if (!fs.existsSync(userProvidersFile)) return bundled;

  try {
    const userRaw = JSON.parse(fs.readFileSync(userProvidersFile, "utf8"));
    const user = RegistrySchema.partial({ schemaVersion: true, lastUpdated: true })
      .extend({ providers: z.array(ProviderSchema) })
      .parse(userRaw);
    return mergeRegistries(bundled, user.providers);
  } catch (e) {
    console.warn(
      `claudex: providers.user.json invalid, ignoring. (${(e as Error).message})`
    );
    return bundled;
  }
}

function mergeRegistries(base: Registry, overrides: Provider[]): Registry {
  const map = new Map<string, Provider>(base.providers.map((p) => [p.id, p]));
  for (const p of overrides) map.set(p.id, p);
  return { ...base, providers: Array.from(map.values()) };
}

export function getProvider(id: string): Provider | null {
  return loadRegistry().providers.find((p) => p.id === id) ?? null;
}

export function tierLabel(tier: Provider["tier"], lang: "tr" | "en"): string {
  const map = {
    tr: { free: "ÜCRETSİZ", trial: "DENEME", paid: "ÖDEMELİ" },
    en: { free: "FREE", trial: "TRIAL", paid: "PAID" },
  } as const;
  return map[lang][tier];
}

export function defaultMain(p: Provider): string | null {
  if (p.defaults.main) return p.defaults.main;
  return p.models.find((m) => m.role === "main")?.id ?? null;
}

export function defaultSmall(p: Provider): string | null {
  if (p.defaults.small) return p.defaults.small;
  return p.models.find((m) => m.role === "small")?.id ?? null;
}
