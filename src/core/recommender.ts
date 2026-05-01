import type { Provider, Registry, Model, UseCase } from "./providers.js";
import { USE_CASES } from "./providers.js";

export interface Recommendation {
  provider: Provider;
  model: Model;
  score: number;
  why: string[];
}

const TRIAL_BONUS = 40;
const FREE_BONUS = 100;
const PRIMARY_USECASE_BONUS = 40; // 20 * rank=2
const SECONDARY_USECASE_BONUS = 20; // 20 * rank=1
const MAX_CONTEXT_BONUS = 30;
const FRESHNESS_BONUS_RECENT = 10;
const TRIAL_ENDING_PENALTY = 25;
const TOP_N = 3;

export function isUseCase(s: string): s is UseCase {
  return (USE_CASES as readonly string[]).includes(s);
}

/**
 * Pure ranking function. Given a registry + intent, returns the top-N
 * (provider, model) pairs deduped by provider so output shows variety.
 */
export function recommend(
  registry: Registry,
  intent: UseCase,
  options: { topN?: number; now?: Date } = {}
): Recommendation[] {
  const topN = options.topN ?? TOP_N;
  const now = options.now ?? new Date();

  const candidates: Recommendation[] = [];

  for (const provider of registry.providers) {
    if (provider.tier === "trial" && trialExpired(provider.trialEndsAt, now)) {
      continue;
    }
    for (const model of provider.models) {
      const useCases = model.useCases ?? [];
      const idx = useCases.indexOf(intent);
      if (idx === -1) continue;

      const useCaseRank = idx === 0 ? PRIMARY_USECASE_BONUS : SECONDARY_USECASE_BONUS;
      const why: string[] = [];
      let score = 0;

      if (model.free) {
        score += FREE_BONUS;
        why.push("FREE");
      } else if (provider.tier === "trial") {
        score += TRIAL_BONUS;
        why.push("TRIAL");
      }
      score += useCaseRank;
      why.push(idx === 0 ? "primary" : "secondary");

      if (model.context) {
        const ctxBonus = Math.min(model.context / 10000, MAX_CONTEXT_BONUS);
        score += ctxBonus;
        why.push(`${Math.round(model.context / 1000)}K context`);
      }

      const freshness = freshnessBonus(provider.lastVerified, now);
      score += freshness;

      if (
        provider.tier === "trial" &&
        trialEndingSoon(provider.trialEndsAt, now)
      ) {
        score -= TRIAL_ENDING_PENALTY;
        why.push("trial bitiyor");
      }
      if (model.note) {
        why.push(model.note);
      }

      candidates.push({ provider, model, score, why });
    }
  }

  // Tiebreakers: free > trial > paid → primary > secondary → larger ctx → fresher → alpha id
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    const tierA = tierRank(a);
    const tierB = tierRank(b);
    if (tierA !== tierB) return tierA - tierB;
    const idxA = a.model.useCases?.indexOf(intent) ?? 999;
    const idxB = b.model.useCases?.indexOf(intent) ?? 999;
    if (idxA !== idxB) return idxA - idxB;
    const ctxA = a.model.context ?? 0;
    const ctxB = b.model.context ?? 0;
    if (ctxA !== ctxB) return ctxB - ctxA;
    return a.model.id.localeCompare(b.model.id);
  });

  // Dedupe by provider — keep first (highest scoring) per provider
  const seen = new Set<string>();
  const result: Recommendation[] = [];
  for (const c of candidates) {
    if (seen.has(c.provider.id)) continue;
    seen.add(c.provider.id);
    result.push(c);
    if (result.length >= topN) break;
  }
  return result;
}

function tierRank(r: Recommendation): number {
  if (r.model.free) return 0;
  if (r.provider.tier === "trial") return 1;
  return 2;
}

function trialExpired(trialEndsAt: string | null | undefined, now: Date): boolean {
  if (!trialEndsAt) return false;
  const t = Date.parse(trialEndsAt);
  if (Number.isNaN(t)) return false;
  return t < now.getTime();
}

function trialEndingSoon(
  trialEndsAt: string | null | undefined,
  now: Date,
  days = 14
): boolean {
  if (!trialEndsAt) return false;
  const t = Date.parse(trialEndsAt);
  if (Number.isNaN(t)) return false;
  const diff = (t - now.getTime()) / 86400000;
  return diff > 0 && diff < days;
}

function freshnessBonus(lastVerified: string, now: Date): number {
  const t = Date.parse(lastVerified);
  if (Number.isNaN(t)) return 0;
  const days = (now.getTime() - t) / 86400000;
  if (days < 30) return FRESHNESS_BONUS_RECENT;
  if (days > 180) return 0;
  // linear taper between 30 and 180 days
  return FRESHNESS_BONUS_RECENT * (1 - (days - 30) / 150);
}

export const INTENT_LABELS: Record<UseCase, { tr: string; en: string; description: { tr: string; en: string } }> = {
  "coding-fast": {
    tr: "Hızlı kod / coding-fast",
    en: "Fast coding (TS, Python, refactor)",
    description: {
      tr: "Günlük TS/Python işleri, küçük refactor, hızlı yanıt.",
      en: "Daily TS/Python work, small refactors, fast turnaround.",
    },
  },
  refactor: {
    tr: "Ağır refactor / büyük codebase",
    en: "Heavy refactor / large codebase",
    description: {
      tr: "100K+ LoC çoklu-dosya değişiklikler, derin reasoning.",
      en: "100K+ LoC multi-file changes, deep reasoning.",
    },
  },
  "long-context": {
    tr: "Uzun context (>200K) doküman analizi",
    en: "Long context (>200K) document analysis",
    description: {
      tr: "PDF, log, codebase okuma — büyük context lazım.",
      en: "PDF, logs, large codebase ingestion.",
    },
  },
  "cheap-agent": {
    tr: "Ucuz production agent",
    en: "Cheap production agent",
    description: {
      tr: "Yüksek hacim, paid ama maliyet/performans dengeli.",
      en: "High volume, paid but cost-effective.",
    },
  },
  vision: {
    tr: "Vision + tool use",
    en: "Vision + tool use",
    description: {
      tr: "Screenshot/UI/diagram analizi, multimodal.",
      en: "Screenshot/UI/diagram analysis, multimodal.",
    },
  },
  "multi-agent": {
    tr: "Multi-agent reasoning",
    en: "Multi-agent reasoning",
    description: {
      tr: "Orchestration, planning, çoklu rol.",
      en: "Orchestration, planning, multi-role workflows.",
    },
  },
  "free-trial": {
    tr: "Bedava deneme / öğrenme",
    en: "Free / trial — learning",
    description: {
      tr: "Sıfır maliyet, kart yok, deneme amaçlı.",
      en: "Zero cost, no card, exploration mode.",
    },
  },
  "cheap-batch": {
    tr: "Cheap batch / yoğun hacim",
    en: "Cheap batch / high volume",
    description: {
      tr: "API loop, bulk processing — minimum maliyet.",
      en: "API loops, bulk processing — minimum cost.",
    },
  },
};
