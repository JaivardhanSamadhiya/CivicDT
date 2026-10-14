"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Upload,
  ArrowRight,
  CheckCircle2,
  FileText,
  RotateCcw,
  Download,
  Info,
  LoaderCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssumptionsEditor } from "@/components/assumptions-editor";
import { Pipeline, type StageStatus } from "@/components/pipeline";
import { PageHeading, ResultStats, EvidenceNotice } from "@/components/common";
import { DEFAULT_ASSUMPTIONS, analyze, projectLabels } from "@/lib/engine";
import { examples } from "@/lib/examples";
import {
  analysisInputSchema,
  type AnalysisInput,
  type Assumptions,
  type ExtractionResult,
  type Proposal,
  type ProjectType,
  type AnalysisResult,
} from "@/lib/schema";
import { useWorkspace } from "@/lib/workspace";
import { readAPIJSON } from "@/lib/client-api";
const pending: StageStatus[] = [
  "pending",
  "pending",
  "pending",
  "pending",
  "pending",
  "pending",
  "pending",
];
async function post<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await readAPIJSON<T & { error?: string }>(response);
  if (!response.ok)
    throw new Error(data.error ?? "The request could not be completed.");
  return data;
}
export default function AnalysisPage() {
  return (
    <Suspense
      fallback={
        <div className="card form-panel" role="status">
          Loading proposal workspace…
        </div>
      }
    >
      <AnalysisWorkflow />
    </Suspense>
  );
}
function AnalysisWorkflow() {
  const searchParams = useSearchParams();
  const exampleId = searchParams.get("example");
  const { save } = useWorkspace();
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [type, setType] = useState<ProjectType | "">("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [assumptions, setAssumptions] = useState<Assumptions>({
    ...DEFAULT_ASSUMPTIONS["bike-lane"],
  });
  const [basis, setBasis] = useState<"illustrative" | "user">("illustrative");
  const [accepted, setAccepted] = useState(false);
  const [mode, setMode] = useState<"demo" | "ai">("demo");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fileName, setFileName] = useState("");
  const [statuses, setStatuses] = useState<StageStatus[]>(pending);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [exported, setExported] = useState(false);
  useEffect(() => {
    const e = examples.find((x) => x.id === exampleId);
    if (e) {
      setText(e.text);
      setType(e.id);
    }
  }, [exampleId]);
  function reset() {
    setProposal(null);
    setResult(null);
    setAccepted(false);
    setError("");
    setStatuses(pending);
    setExported(false);
  }
  function setField<K extends keyof Proposal>(key: K, value: Proposal[K]) {
    if (!proposal) return;
    const next = {
      ...proposal,
      [key]: value,
      evidence: proposal.evidence.filter(
        (e) => e.field !== key && !e.field.startsWith(`${String(key)}.`),
      ),
    };
    next.missing = [
      ...(!next.type ? ["type"] : []),
      ...(!next.location?.trim() ? ["location"] : []),
      ...(next.type === "pedestrian"
        ? next.crossingCount === null
          ? ["crossingCount"]
          : []
        : next.distanceMiles === null
          ? ["distanceMiles"]
          : []),
      ...(next.budget === null ? ["budget"] : []),
      ...(!next.changes.length ? ["changes"] : []),
      ...(!next.objectives.length ? ["objectives"] : []),
    ];
    setProposal(next);
  }
  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: form,
      });
      const data = await readAPIJSON<{
        text: string;
        name: string;
        error?: string;
      }>(response);
      if (!response.ok) throw new Error(data.error ?? "Upload failed.");
      setText(data.text);
      setFileName(data.name);
      setStatuses(["done", ...pending.slice(1)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
      setStatuses(["error", ...pending.slice(1)]);
    } finally {
      setBusy(false);
    }
  }
  async function extract() {
    setError("");
    setWarning("");
    setBusy(true);
    setStatuses(["done", "running", ...pending.slice(2)]);
    try {
      if (text.trim().length < 20)
        throw new Error(
          "Provide at least 20 characters describing the proposal.",
        );
      if (text.length > 30000)
        throw new Error("The proposal must be 30,000 characters or fewer.");
      const data = await post<ExtractionResult>("/api/extract", { text });
      let next = data.proposal;
      if (type)
        next = {
          ...next,
          type,
          evidence:
            next.type === type
              ? next.evidence
              : next.evidence.filter((e) => e.field !== "type"),
        };
      if (location.trim())
        next = {
          ...next,
          location: location.trim(),
          evidence: next.evidence.filter((e) => e.field !== "location"),
        };
      setProposal(next);
      setAssumptions({ ...DEFAULT_ASSUMPTIONS[next.type ?? "bike-lane"] });
      setMode(data.mode);
      setWarning(data.warning ?? "");
      setAccepted(false);
      setStatuses(["done", "done", "review", ...pending.slice(3)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Extraction failed.");
      setStatuses(["done", "error", ...pending.slice(2)]);
    } finally {
      setBusy(false);
    }
  }
  async function run() {
    if (!proposal) return;
    setBusy(true);
    setError("");
    setStatuses(["done", "done", "running", ...pending.slice(3)]);
    try {
      if (!accepted)
        throw new Error(
          "Confirm that you have reviewed the proposal and cost assumptions.",
        );
      const input: AnalysisInput = {
        proposal,
        assumptions,
        assumptionBasis: basis,
        illustrativeAccepted: accepted,
      };
      const validated = analysisInputSchema.parse(input);
      analyze(validated);
      setStatuses([
        "done",
        "done",
        "done",
        "running",
        "running",
        "pending",
        "pending",
      ]);
      const computed = await post<AnalysisResult>("/api/analyze", validated);
      save(validated, mode, computed);
      setResult(computed);
      setStatuses(["done", "done", "done", "done", "done", "done", "pending"]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Calculation failed.");
      setStatuses(["done", "done", "error", ...pending.slice(3)]);
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    if (!result) return;
    setBusy(true);
    setError("");
    setStatuses(["done", "done", "done", "done", "done", "done", "running"]);
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.input),
      });
      if (!response.ok) {
        const data = await readAPIJSON(response);
        throw new Error(data.error ?? "Report generation failed.");
      }
      const url = URL.createObjectURL(await response.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = "civicdt-decision-brief.pdf";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      setExported(true);
      setStatuses((st) => st.map(() => "done"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed.");
      setStatuses(["done", "done", "done", "done", "done", "done", "error"]);
    } finally {
      setBusy(false);
    }
  }
  const sourceNote = (field: string) => {
    const e = proposal?.evidence.find((x) => x.field === field);
    return e ? (
      <small className="source-quote">Source: “{e.quote}”</small>
    ) : (
      <small>Not extracted · confirm or supply this field</small>
    );
  };
  return (
    <>
      <PageHeading
        eyebrow="PROPOSAL TO PERSPECTIVE"
        title="New infrastructure analysis"
        description="Describe the project. Review the inputs. Explore what follows."
      />
      <div className="workflow-tabs">
        <span className={!proposal ? "current" : "complete"}>
          01 <strong>Describe</strong>
        </span>
        <span
          className={proposal && !result ? "current" : result ? "complete" : ""}
        >
          02 <strong>Review & confirm</strong>
        </span>
        <span className={result ? "current" : ""}>
          03 <strong>Compare & brief</strong>
        </span>
      </div>
      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}
      {warning && (
        <div className="alert" role="status">
          {warning}
        </div>
      )}
      <div className="workflow-layout">
        <div>
          {!proposal ? (
            <section className="card form-panel">
              <div className="panel-heading">
                <h2>Tell us about the proposal</h2>
                <span className="soft-badge">TEXT OR DOCUMENT</span>
              </div>
              <p className="muted">
                Include location, scope, proposed changes, and objectives.
                Missing information stays unknown.
              </p>
              <div className="example-picker">
                <span>Start with an example</span>
                {examples.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => {
                      setText(e.text);
                      setType(e.id);
                      setFileName("");
                    }}
                  >
                    {projectLabels[e.id]}
                  </button>
                ))}
              </div>
              <label className="field">
                <span>Project description</span>
                <textarea
                  value={text}
                  maxLength={30000}
                  rows={9}
                  placeholder="For example: evaluate a protected bike lane along a 1.5-mile corridor on Elm Avenue in Demo City…"
                  onChange={(e) => setText(e.target.value)}
                />
                <small>
                  {text.length.toLocaleString()} / 30,000 characters · source
                  passages are preserved
                </small>
              </label>
              <label className={`upload-zone ${busy ? "disabled" : ""}`}>
                <Upload size={20} />
                <span>
                  <strong>{fileName || "Upload a proposal document"}</strong>
                  <small>
                    TXT or text-based PDF · up to 2 MB · scanned PDFs
                    unsupported
                  </small>
                </span>
                <input
                  aria-label="Upload proposal"
                  type="file"
                  accept=".txt,.pdf,text/plain,application/pdf"
                  disabled={busy}
                  onChange={(e) => upload(e.target.files?.[0])}
                />
              </label>
              <div className="form-grid">
                <label className="field">
                  <span>
                    Project type <em>optional</em>
                  </span>
                  <select
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as ProjectType | "")
                    }
                  >
                    <option value="">Extract from proposal</option>
                    {Object.entries(projectLabels).map(([id, label]) => (
                      <option key={id} value={id}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>
                    Location <em>optional</em>
                  </span>
                  <input
                    value={location}
                    maxLength={240}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Street, neighborhood, city"
                  />
                </label>
              </div>
              <div className="form-footer">
                <span>
                  <Info size={14} /> Demo mode is fully functional without an AI
                  key.
                </span>
                <Button
                  disabled={busy || text.trim().length < 20}
                  onClick={extract}
                >
                  {busy ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <FileText size={16} />
                  )}
                  Extract proposal
                  <ArrowRight size={16} />
                </Button>
              </div>
            </section>
          ) : !result ? (
            <>
              <section className="card form-panel">
                <div className="panel-heading">
                  <h2>Review the extracted proposal</h2>
                  <span className="soft-badge">
                    {mode === "ai" ? "AI EXTRACTION" : "RULE-BASED EXTRACTION"}
                  </span>
                </div>
                <p className="muted">
                  Extraction is a starting point. Edit any value before running
                  the model.
                </p>
                <div className="form-grid">
                  <label className="field span-2">
                    <span>Project title</span>
                    <input
                      maxLength={180}
                      value={proposal.title}
                      onChange={(e) => setField("title", e.target.value)}
                    />
                  </label>
                  <label className="field">
                    <span>Intervention type</span>
                    <select
                      value={proposal.type ?? ""}
                      onChange={(e) => {
                        const next = e.target.value as ProjectType;
                        setField("type", next);
                        setAssumptions({ ...DEFAULT_ASSUMPTIONS[next] });
                        setAccepted(false);
                      }}
                    >
                      <option value="" disabled>
                        Select a project type
                      </option>
                      {Object.entries(projectLabels).map(([id, label]) => (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {sourceNote("type")}
                  </label>
                  <label className="field">
                    <span>Project location</span>
                    <input
                      value={proposal.location ?? ""}
                      maxLength={240}
                      onChange={(e) =>
                        setField("location", e.target.value || null)
                      }
                      placeholder="Required before calculation"
                    />
                    {sourceNote("location")}
                  </label>
                  <label className="field">
                    <span>
                      {proposal.type === "pedestrian"
                        ? "Number of crossings"
                        : "Corridor distance (miles)"}
                    </span>
                    <input
                      type="number"
                      min="0.001"
                      step={proposal.type === "pedestrian" ? 1 : "any"}
                      value={
                        (proposal.type === "pedestrian"
                          ? proposal.crossingCount
                          : proposal.distanceMiles) ?? ""
                      }
                      onChange={(e) =>
                        setField(
                          proposal.type === "pedestrian"
                            ? "crossingCount"
                            : "distanceMiles",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      placeholder="Unknown · supply scope"
                    />
                    {sourceNote(
                      proposal.type === "pedestrian"
                        ? "crossingCount"
                        : "distanceMiles",
                    )}
                  </label>
                  <label className="field">
                    <span>
                      Stated budget (USD) <em>optional</em>
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={proposal.budget ?? ""}
                      onChange={(e) =>
                        setField(
                          "budget",
                          e.target.value ? Number(e.target.value) : null,
                        )
                      }
                      placeholder="Unknown · no value assumed"
                    />
                    {sourceNote("budget")}
                  </label>
                  <label className="field span-2">
                    <span>Proposed infrastructure changes</span>
                    <textarea
                      rows={2}
                      value={proposal.changes.join("\n")}
                      onChange={(e) =>
                        setField(
                          "changes",
                          e.target.value.split("\n").filter(Boolean),
                        )
                      }
                    />
                    <small>One change per line</small>
                  </label>
                  <label className="field span-2">
                    <span>Stated objectives</span>
                    <textarea
                      rows={2}
                      value={proposal.objectives.join("\n")}
                      onChange={(e) =>
                        setField(
                          "objectives",
                          e.target.value.split("\n").filter(Boolean),
                        )
                      }
                    />
                  </label>
                </div>
                <div className="missing-box">
                  <strong>What still needs investigation</strong>
                  <p>
                    {proposal.missing.length
                      ? proposal.missing.join(", ")
                      : "No required scope fields flagged; engineering inputs still need review."}
                  </p>
                  <span>
                    Budget is optional for a cost comparison. Local cost
                    validation, right-of-way, geometry, and outcome datasets are
                    not supplied by this demo.
                  </span>
                </div>
                <details className="source-details">
                  <summary>View original source and evidence</summary>
                  <p className="source-text">{proposal.sourceText}</p>
                  {proposal.evidence.map((e, i) => (
                    <p key={i} className="source-evidence">
                      <strong>{e.field}</strong> [{e.start}:{e.end}] “{e.quote}”
                    </p>
                  ))}
                </details>
              </section>
              <section className="card form-panel">
                <div className="panel-heading">
                  <h2>Confirm cost assumptions</h2>
                  <span className="soft-badge">
                    USD ·{" "}
                    {proposal.type === "pedestrian"
                      ? "PER CROSSING"
                      : "PER CORRIDOR MILE"}
                  </span>
                </div>
                <div className="alert">
                  <Info size={17} />
                  <span>
                    Defaults are authored illustrative inputs, not observed
                    costs. Edit these values to explore scenarios.
                  </span>
                </div>
                <label className="field">
                  <span>Assumption basis</span>
                  <select
                    value={basis}
                    onChange={(e) => {
                      setBasis(e.target.value as "illustrative" | "user");
                      setAccepted(false);
                    }}
                  >
                    <option value="illustrative">
                      Illustrative demonstration assumptions (editable)
                    </option>
                    <option value="user">
                      Planner-supplied estimates (verify every value)
                    </option>
                  </select>
                </label>
                <AssumptionsEditor
                  value={assumptions}
                  onChange={setAssumptions}
                  unit={
                    proposal.type === "pedestrian"
                      ? "crossing"
                      : "corridor mile"
                  }
                />
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                  />
                  <span>
                    I have reviewed the proposal and{" "}
                    {basis === "illustrative"
                      ? "accept these explicitly illustrative cost assumptions"
                      : "confirm all cost assumptions as my supplied estimates"}
                    . I understand that outcomes are not quantified.
                  </span>
                </label>
                <div className="form-footer">
                  <Button variant="ghost" onClick={reset}>
                    <RotateCcw size={15} />
                    Edit source
                  </Button>
                  <Button disabled={busy || !accepted} onClick={run}>
                    {busy && <LoaderCircle size={16} className="spin" />}Run
                    scenario analysis
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </section>
            </>
          ) : (
            <>
              <div className="success-banner">
                <CheckCircle2 size={22} />
                <div>
                  <strong>Three scenarios, calculated.</strong>
                  <p>
                    {result.input.proposal.title} ·{" "}
                    {result.input.proposal.location}
                  </p>
                </div>
              </div>
              <ResultStats result={result} />
              <EvidenceNotice basis={result.input.assumptionBasis} />
              <section className="card form-panel">
                <h2>A brief grounded in the model</h2>
                <p className="report-summary">{result.summary}</p>
                <div className="result-actions">
                  <Button asChild>
                    <Link href="/comparison">
                      Compare scenarios
                      <ArrowRight size={16} />
                    </Link>
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={busy}
                    onClick={download}
                  >
                    {busy ? (
                      <LoaderCircle className="spin" size={16} />
                    ) : (
                      <Download size={16} />
                    )}
                    Download decision brief
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/map">Explore project map</Link>
                  </Button>
                </div>
                {exported && (
                  <p className="success-text" role="status">
                    PDF generated from validated model inputs.
                  </p>
                )}
              </section>
            </>
          )}
        </div>
        <Pipeline statuses={statuses} />
      </div>
    </>
  );
}
