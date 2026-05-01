import type { Provider } from "./providers.js";

export type ValidateOutcome =
  | { ok: true; latencyMs: number; status: number }
  | { ok: false; reason: string; status?: number };

export interface ValidateOpts {
  apiKey: string;
  model: string;
  baseUrl: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * Send a 1-token messages API ping to an Anthropic-compatible endpoint.
 * Returns ok=true even for 2xx; tries to surface useful error text otherwise.
 */
export async function pingProvider(opts: ValidateOpts): Promise<ValidateOutcome> {
  const fetchFn = opts.fetchImpl ?? fetch;
  const ctrl = new AbortController();
  const timeoutMs = opts.timeoutMs ?? 8000;
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  const url = `${opts.baseUrl.replace(/\/$/, "")}/v1/messages`;
  const start = Date.now();
  try {
    const res = await fetchFn(url, {
      method: "POST",
      signal: ctrl.signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": opts.apiKey,
        Authorization: `Bearer ${opts.apiKey}`,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: opts.model,
        max_tokens: 1,
        messages: [{ role: "user", content: "hi" }],
      }),
    });
    const latencyMs = Date.now() - start;
    if (res.ok) {
      return { ok: true, latencyMs, status: res.status };
    }
    const body = await safeText(res);
    return {
      ok: false,
      status: res.status,
      reason: shortReason(res.status, body),
    };
  } catch (e: unknown) {
    if ((e as { name?: string }).name === "AbortError") {
      return { ok: false, reason: `timeout after ${timeoutMs}ms` };
    }
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: msg };
  } finally {
    clearTimeout(t);
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 400);
  } catch {
    return "";
  }
}

function shortReason(status: number, body: string): string {
  if (status === 401 || status === 403) return `${status} unauthorized — key invalid?`;
  if (status === 404) return `${status} not found — wrong base URL or model id?`;
  if (status === 429) return `${status} rate limited — try later`;
  if (status >= 500) return `${status} provider error`;
  if (body) {
    return `${status}: ${body.slice(0, 120)}`;
  }
  return `${status}`;
}

export function buildPingArgs(provider: Provider, model: string, key: string): ValidateOpts | null {
  if (!provider.baseUrl) return null; // anthropic default — skip
  return {
    apiKey: key,
    model,
    baseUrl: provider.baseUrl,
  };
}
