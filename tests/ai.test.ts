import { afterEach, describe, expect, it, vi } from "vitest";
import { getExtractionProvider } from "../src/lib/ai";
import { extractDeterministic, extractProposal } from "../src/lib/extraction";
import { examples } from "../src/lib/examples";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe("server extraction provider", () => {
  it("makes no calls in demo mode even when a key happens to exist", async () => {
    vi.stubEnv("AI_PROVIDER", "demo");
    vi.stubEnv("OPENAI_API_KEY", "fake-test-key");
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    expect(getExtractionProvider()).toBeNull();
    expect((await extractProposal(examples[0].text)).mode).toBe("demo");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("falls back with no key and does not claim a model ran", async () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "");
    const result = await extractProposal(examples[0].text);
    expect(result.mode).toBe("demo");
    expect(result.warning).toContain("No AI model was called");
  });

  it("uses strict structured output, bounded timeout and server-only credentials", async () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "fake-test-key");
    vi.stubEnv("OPENAI_MODEL", "test-model");
    const { title: _title, missing: _missing, sourceText: _sourceText, ...facts } = extractDeterministic(examples[0].text);
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: JSON.stringify(facts) }] }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetch);
    const result = await extractProposal(examples[0].text);
    expect(result.mode).toBe("ai");
    expect(result.provider).toBe("OpenAI");
    const [url, options] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.openai.com/v1/responses");
    const body = JSON.parse(options.body as string);
    expect(body.store).toBe(false);
    expect(body.model).toBe("test-model");
    expect(body.text.format.strict).toBe(true);
    expect(body.text.format.schema.additionalProperties).toBe(false);
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.stringify(result)).not.toContain("fake-test-key");
  });

  it.each([401, 429, 500])("returns a safe fallback for HTTP %s without revealing provider details", async status => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "private-test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("sensitive provider diagnostics", { status })));
    const result = await extractProposal(examples[0].text);
    expect(result.mode).toBe("demo");
    expect(result.warning).toContain("unavailable");
    expect(JSON.stringify(result)).not.toMatch(/sensitive|private-test-key/);
  });

  it("falls back on refusal, malformed and incomplete provider output", async () => {
    vi.stubEnv("AI_PROVIDER", "openai");
    vi.stubEnv("OPENAI_API_KEY", "fake-test-key");
    const bodies = [
      { status: "incomplete", output: [] },
      { status: "completed", output: [{ type: "message", content: [{ type: "refusal" }] }] },
      { status: "completed", output: [{ type: "message", content: [{ type: "output_text", text: "invalid JSON" }] }] },
    ];
    for (const body of bodies) {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
      expect((await extractProposal(examples[0].text)).mode).toBe("demo");
    }
  });
});
