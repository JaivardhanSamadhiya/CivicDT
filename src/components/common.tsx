"use client";
import Link from "next/link";
import { ArrowRight, Info, MapPin, Plus, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { formatMoney } from "@/lib/engine";
import type { AnalysisResult } from "@/lib/schema";
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {action}
    </div>
  );
}
export function EmptyState({
  title = "Start with a proposal",
  description = "Run an analysis to compare scenarios, explore the project map, and create a decision brief.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <FileText size={30} />
      </div>
      <h2>{title}</h2>
      <p>{description}</p>
      <Button asChild>
        <Link href="/analysis">
          <Plus size={16} />
          New analysis
        </Link>
      </Button>
    </div>
  );
}
export function EvidenceNotice({ basis = "illustrative" }: { basis?: string }) {
  return (
    <div className="evidence-notice">
      <Info size={18} />
      <div>
        <strong>
          {basis === "illustrative"
            ? "Illustrative model · no observed city outcomes"
            : "User-supplied assumptions · not independently verified"}
        </strong>
        <span>
          {" "}
          Costs are incremental USD estimates. Safety, access, and
          transportation effects are qualitative. Sensitivity bounds are
          scenarios, not confidence intervals.
        </span>
      </div>
    </div>
  );
}
export function ResultStats({ result }: { result: AnalysisResult }) {
  const p = result.scenarios[1];
  return (
    <div className="stat-grid">
      <div className="stat-card">
        <span className="stat-label">Proposed capital</span>
        <strong>{formatMoney(p.capitalCost)}</strong>
        <span className="stat-detail">
          {formatMoney(p.capitalLow)}–{formatMoney(p.capitalHigh)}
        </span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Annual maintenance</span>
        <strong>{formatMoney(p.annualMaintenance)}</strong>
        <span className="stat-detail">Incremental / year</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">
          {result.input.assumptions.horizonYears}-year modeled total
        </span>
        <strong>{formatMoney(p.lifecycleCost)}</strong>
        <span className="stat-detail">Undiscounted · excludes inflation</span>
      </div>
      <div className="stat-card">
        <span className="stat-label">Project scope</span>
        <strong>
          {result.quantity}
          <small>{result.unit === "crossing" ? "crossings" : "miles"}</small>
        </strong>
        <span className="stat-detail">
          <MapPin size={13} />
          Supplied scope · not GIS measured
        </span>
      </div>
    </div>
  );
}
export function SectionLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link className="text-link" href={href}>
      {children}
      <ArrowRight size={15} />
    </Link>
  );
}
