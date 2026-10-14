"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Leaf,
  ArrowUpRight,
  CheckCircle2,
  Save,
  RotateCcw,
  Info,
  FileText,
} from "lucide-react";
import {
  calculateClimate,
  emptyClimateInput,
  climateThoughtExperiment,
  EPA_GASOLINE_BENCHMARK,
  type ClimateInput,
  type ClimateResult,
} from "@/lib/climate";
import { useWorkspace } from "@/lib/workspace";
import { PageHeading, EmptyState } from "@/components/common";
import { Button } from "@/components/ui/button";
function Worksheet() {
  const { active, update } = useWorkspace();
  const [draft, setDraft] = useState<ClimateInput>(
    active?.result.input.climate ?? emptyClimateInput(),
  );
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  let result: ClimateResult | null = null;
  try {
    result = calculateClimate(draft);
  } catch {}
  useEffect(() => {
    setDraft(active?.result.input.climate ?? emptyClimateInput());
    setSaved(false);
    setError("");
  }, [active?.id]);
  function change(patch: Partial<ClimateInput>) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setSaved(false);
    setError("");
  }
  function save() {
    if (!active) return;
    try {
      calculateClimate(draft);
      update({ ...active.result.input, climate: draft });
      setSaved(true);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Review climate inputs.");
    }
  }
  return (
    <>
      <div className="comparison-grid">
        <section className="card form-panel">
          <div className="panel-heading">
            <h2>Build a conditional climate scenario</h2>
            <span className="soft-badge">NO UPTAKE FORECAST</span>
          </div>
          <p className="muted">
            Supply annual avoided vehicle activity independently of the corridor
            scope. This model does not infer how many people will change travel
            modes.
          </p>
          <div className="alert">
            <Info size={17} />
            <span>
              A lane is not an emissions reduction measurement. Quantification
              needs activity data, a counterfactual, and a factor appropriate to
              the vehicles.
            </span>
          </div>
          <div className="form-grid">
            <label className="field">
              <span>Annual avoided vehicle miles</span>
              <input
                type="number"
                min="0"
                step="any"
                value={draft.avoidedMiles ?? ""}
                placeholder="Unknown · supply an assumption"
                onChange={(e) =>
                  change({
                    avoidedMiles:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <small>
                Vehicle miles / year · not passenger miles or corridor length
              </small>
            </label>
            <label className="field">
              <span>Activity evidence basis</span>
              <select
                value={draft.basis}
                onChange={(e) =>
                  change({ basis: e.target.value as ClimateInput["basis"] })
                }
              >
                <option value="hypothetical">
                  Hypothetical thought experiment
                </option>
                <option value="measured">
                  User-described measured activity (unverified)
                </option>
              </select>
            </label>
            <label className="field span-2">
              <span>Emissions-factor source</span>
              <select
                value={draft.factorSource ?? ""}
                onChange={(e) => {
                  const source = e.target.value as
                    | ClimateInput["factorSource"]
                    | "";
                  change({
                    factorSource: source || null,
                    gramsPerMile:
                      source === EPA_GASOLINE_BENCHMARK.id
                        ? EPA_GASOLINE_BENCHMARK.gramsPerMile
                        : null,
                  });
                }}
              >
                <option value="">No factor selected · unknown</option>
                <option value={EPA_GASOLINE_BENCHMARK.id}>
                  EPA approximate gasoline passenger-vehicle benchmark · 400 g
                  CO₂/mile
                </option>
                <option value="user">User-supplied tailpipe CO₂ factor</option>
              </select>
              <small>
                EPA benchmark verified October 13, 2026; source updated June 3,
                2026. Not a local mixed-fleet estimate.
              </small>
            </label>
            <label className="field">
              <span>Tailpipe CO₂ factor</span>
              <input
                type="number"
                min="0"
                step="any"
                disabled={draft.factorSource !== "user"}
                value={draft.gramsPerMile ?? ""}
                placeholder="Unknown"
                onChange={(e) =>
                  change({
                    gramsPerMile:
                      e.target.value === "" ? null : Number(e.target.value),
                  })
                }
              />
              <small>Grams CO₂ / vehicle mile</small>
            </label>
            <label className="field span-2">
              <span>Evidence and assumption notes</span>
              <textarea
                rows={3}
                maxLength={2000}
                value={draft.evidenceNote}
                onChange={(e) => change({ evidenceNote: e.target.value })}
                placeholder="Describe the activity source, period, counterfactual, and factor scope. Required for measured activity or a user factor."
              />
            </label>
          </div>
          <div className="result-actions">
            <Button
              variant="secondary"
              onClick={() => {
                setDraft(climateThoughtExperiment());
                setSaved(false);
                setError("");
              }}
            >
              Load hypothetical example
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setDraft(emptyClimateInput());
                setSaved(false);
              }}
            >
              <RotateCcw size={14} />
              Reset to unknown
            </Button>
          </div>
          {error && (
            <div className="alert error" role="alert">
              {error}
            </div>
          )}
          <div className="form-footer">
            <span>
              Save to include this worksheet and its limitations in the decision
              brief.
            </span>
            <Button onClick={save}>
              <Save size={15} />
              Save climate worksheet
            </Button>
          </div>
          {saved && (
            <p className="success-text" role="status">
              Climate worksheet saved. The PDF now includes a conditional
              climate appendix.
            </p>
          )}
        </section>
        <aside className="card sensitivity-panel climate-result">
          <span className="eyebrow">CONDITIONAL OUTPUT</span>
          <div className="climate-symbol">
            <Leaf size={27} />
          </div>
          <h2>
            {result?.status === "calculated"
              ? `${result.grossAvoidedTailpipeTonnes.toLocaleString("en-US", { maximumSignificantDigits: 4 })} metric tonnes / year`
              : "Not yet calculated"}
          </h2>
          <span className="climate-output-label">
            Gross avoided tailpipe CO₂
          </span>
          <p>
            {result?.summary ??
              "Review the input values and source notes. No output is shown for invalid assumptions."}
          </p>
          {result?.status === "missing-inputs" && (
            <ul className="climate-missing">
              {result.missing.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
          <div className="formula-box" style={{ marginTop: 23 }}>
            Avoided vehicle miles / year
            <br />× grams CO₂ / vehicle mile
            <br />÷ 1,000,000 grams / tonne
          </div>
          <div className="sensitivity-note">
            This is conditional arithmetic. It is not a causal project finding,
            net lifecycle estimate, or carbon-credit calculation.
          </div>
          {draft.factorSource === EPA_GASOLINE_BENCHMARK.id && (
            <a
              className="text-link"
              style={{ marginTop: 16 }}
              href={EPA_GASOLINE_BENCHMARK.url}
              target="_blank"
              rel="noreferrer"
            >
              Read the EPA factor source
              <ArrowUpRight size={14} />
            </a>
          )}
          <Button variant="ghost" asChild>
            <Link href="/reports">
              <FileText size={14} />
              Open decision brief
            </Link>
          </Button>
        </aside>
      </div>
      <div className="section-heading">
        <h2>What would make the impact claim credible?</h2>
        <span className="soft-badge">LOCAL PILOT PLAN</span>
      </div>
      <div className="method-grid">
        {[
          {
            title: "Define the local problem",
            body: "Select a real corridor with a school, transit, or community connection. Document current access barriers and whose trips could be served. Verify right-of-way and engage people with mobility needs.",
          },
          {
            title: "Establish activity and a counterfactual",
            body: "Collect weekday and weekend bicycle, pedestrian, and vehicle counts, plus an opt-in travel survey. Specify what would happen without the project. Bicycle counts alone cannot establish avoided car miles.",
          },
          {
            title: "Test a feasible intervention",
            body: "Ask the responsible agency to assess an appropriate pilot treatment and cost scope. Investigate loading, emergency access, accessible crossings, maintenance, permits, and consultation before any installation.",
          },
          {
            title: "Measure without overclaiming",
            body: "Compare repeat observations over matched seasons and conditions; use a suitable control where feasible. Document displaced vehicle activity, replacement-mode emissions, construction impacts, and uncertainty before claiming net benefit.",
          },
        ].map((item, i) => (
          <section className="card method-card" key={item.title}>
            <p className="eyebrow">0{i + 1} · RESEARCH TO IMPLEMENTATION</p>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </section>
        ))}
      </div>
      <section className="card method-card">
        <h3>Boundaries of this climate worksheet</h3>
        <ul>
          {(
            result?.limitations ??
            calculateClimate(emptyClimateInput()).limitations
          ).map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
export default function ClimatePage() {
  const { active } = useWorkspace();
  return (
    <>
      <PageHeading
        eyebrow="CLIMATE EVIDENCE"
        title="Make the impact claim earn its place."
        description={
          active
            ? `${active.result.input.proposal.title} · conditional activity-to-emissions worksheet`
            : "Connect mobility planning to a measurable, defensible climate pathway."
        }
      />
      {active ? (
        <Worksheet key={active.id} />
      ) : (
        <EmptyState
          title="Start with a mobility proposal"
          description="Run a cost analysis first, then add climate assumptions and a pilot measurement plan. No emissions savings are inferred from the project description."
        />
      )}
    </>
  );
}
