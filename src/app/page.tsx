"use client";
import Link from "next/link";
import {
  Bike,
  Bus,
  Footprints,
  ArrowRight,
  Plus,
  ArrowUpRight,
  CheckCircle2,
  FileText,
  Layers3,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  PageHeading,
  ResultStats,
  EvidenceNotice,
  SectionLink,
} from "@/components/common";
import { useWorkspace } from "@/lib/workspace";
import { examples } from "@/lib/examples";
const icons = {
  "bike-lane": Bike,
  "bus-priority": Bus,
  pedestrian: Footprints,
};
function CorridorDiagram() {
  return (
    <svg
      viewBox="0 0 560 290"
      className="corridor-diagram"
      role="img"
      aria-label="Conceptual street network with an illustrative project corridor"
    >
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path
            d="M32 0H0V32"
            fill="none"
            stroke="#8ba7b5"
            strokeOpacity=".12"
          />
        </pattern>
      </defs>
      <rect width="560" height="290" fill="url(#grid)" />
      <g fill="#284252" stroke="#385968">
        <rect x="70" y="28" width="100" height="50" rx="6" />
        <rect x="194" y="28" width="104" height="50" rx="6" />
        <rect x="327" y="28" width="87" height="50" rx="6" />
        <rect x="70" y="116" width="100" height="59" rx="6" />
        <rect x="194" y="116" width="104" height="59" rx="6" />
        <rect x="327" y="116" width="87" height="59" rx="6" />
        <rect x="70" y="210" width="100" height="51" rx="6" />
        <rect x="194" y="210" width="104" height="51" rx="6" />
        <rect x="327" y="210" width="87" height="51" rx="6" />
      </g>
      <path
        d="M32 95h430M32 192h430M182 0v290M312 0v290M428 0v290"
        fill="none"
        stroke="#547080"
        strokeWidth="7"
      />
      <path
        d="M87 192h225V95h111"
        fill="none"
        stroke="#32d8b1"
        strokeWidth="26"
        strokeOpacity=".09"
      />
      <path
        d="M87 192h225V95h111"
        fill="none"
        stroke="#38d3b1"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <circle
        cx="87"
        cy="192"
        r="9"
        fill="#173647"
        stroke="#71edce"
        strokeWidth="3"
      />
      <circle cx="423" cy="95" r="9" fill="#71edce" />
      <rect
        x="201"
        y="130"
        width="104"
        height="32"
        rx="5"
        fill="#153745"
        stroke="#30977f"
      />
      <text
        x="214"
        y="151"
        fill="#9bf2da"
        fontSize="11"
        fontFamily="sans-serif"
      >
        PROJECT CORRIDOR
      </text>
      <text x="370" y="248" fill="#9cafb9" fontSize="10">
        CONCEPTUAL · NOT GIS
      </text>
    </svg>
  );
}
export default function Dashboard() {
  const { active, projects, remove } = useWorkspace();
  return (
    <>
      <PageHeading
        eyebrow="YOUR PLANNING WORKSPACE"
        title="Better decisions begin with clarity."
        description="Plan low-carbon mobility with the costs, evidence, and uncertainties in view."
        action={
          <Button asChild>
            <Link href="/analysis">
              <Plus size={16} />
              New analysis
            </Link>
          </Button>
        }
      />
      <div className="overview-hero">
        <div className="hero-copy">
          <span className="hero-tag">
            <span className="status-dot" />
            EVIDENCE-AWARE PLANNING
          </span>
          <h2>
            One proposal.
            <br />A clearer view of the tradeoffs.
          </h2>
          <p>
            Turn a mobility proposal into transparent cost scenarios, a climate
            evidence worksheet, and a brief for your community.
          </p>
          <div className="hero-actions">
            <Button asChild>
              <Link href="/analysis">
                Evaluate a proposal
                <ArrowRight size={16} />
              </Link>
            </Button>
            <Link className="hero-link" href="/analysis?example=bike-lane">
              Try the bike lane demo
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <CorridorDiagram />
      </div>
      <div className="overview-strip">
        <div>
          <CheckCircle2 size={18} />
          <span>
            <strong>Traceable inputs</strong>Source passages stay connected
          </span>
        </div>
        <div>
          <Layers3 size={18} />
          <span>
            <strong>Three perspectives</strong>Baseline, proposal, alternative
          </span>
        </div>
        <div>
          <FileText size={18} />
          <span>
            <strong>A shareable decision brief</strong>Costs, climate
            assumptions, and limits
          </span>
        </div>
      </div>
      {active && (
        <>
          <div className="section-heading">
            <h2>Current analysis</h2>
            <SectionLink href="/comparison">Open comparison</SectionLink>
          </div>
          <ResultStats result={active.result} />
          <EvidenceNotice basis={active.result.input.assumptionBasis} />
        </>
      )}
      <div className="section-heading">
        <div>
          <h2>Explore a planning scenario</h2>
          <p>Hypothetical examples. Real calculations. No API key required.</p>
        </div>
        <span className="soft-badge">3 DEMO SCENARIOS</span>
      </div>
      <div className="demo-grid">
        {examples.map((e, i) => {
          const Icon = icons[e.id];
          return (
            <Link
              className="demo-card"
              key={e.id}
              href={`/analysis?example=${e.id}`}
            >
              <div className="demo-card-top">
                <span className={`demo-icon icon-${i}`}>
                  <Icon size={23} />
                </span>
                <span className="demo-label">
                  {i === 0 ? "CORE DEMO" : "COST MODEL"}
                </span>
              </div>
              <h3>{e.title}</h3>
              <p>{e.description}</p>
              <div className="demo-card-footer">
                <span>
                  {i === 0
                    ? "Most complete workflow"
                    : "Functional illustrative example"}
                </span>
                <ArrowRight size={17} />
              </div>
            </Link>
          );
        })}
      </div>
      <div className="section-heading">
        <div>
          <h2>Saved analyses</h2>
          <p>
            Stored on this browser. Keep an exported brief for a durable copy.
          </p>
        </div>
        <span className="soft-badge">{projects.length} SAVED</span>
      </div>
      {projects.length ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Project</th>
                <th>Scope</th>
                <th>Input basis</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>
                    <strong>{p.result.input.proposal.title}</strong>
                    <span className="table-secondary">
                      {p.result.input.proposal.location}
                    </span>
                  </td>
                  <td>
                    {p.result.quantity} {p.result.unit}
                    {p.result.quantity !== 1 ? "s" : ""}
                  </td>
                  <td>
                    <span className="soft-badge">
                      {p.result.input.assumptionBasis}
                    </span>
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${p.result.input.proposal.title}`}
                      onClick={() => remove(p.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="saved-empty">
          <span className="empty-icon">
            <Layers3 size={22} />
          </span>
          <div>
            <strong>Your next analysis starts here.</strong>
            <p>
              Describe a proposal or explore a demo to build your workspace.
            </p>
          </div>
          <SectionLink href="/analysis">Create an analysis</SectionLink>
        </div>
      )}
    </>
  );
}
