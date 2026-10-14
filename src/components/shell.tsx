"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plus,
  Layers3,
  Map,
  FileText,
  SlidersHorizontal,
  ArrowUpRight,
  ShieldCheck,
  Leaf,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace";
const links = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/analysis", label: "New analysis", icon: Plus },
  { href: "/comparison", label: "Scenario comparison", icon: Layers3 },
  { href: "/climate", label: "Climate evidence", icon: Leaf },
  { href: "/map", label: "Project map", icon: Map },
  { href: "/reports", label: "Decision briefs", icon: FileText },
  {
    href: "/methodology",
    label: "Assumptions & methods",
    icon: SlidersHorizontal,
  },
];
export function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { notice, active, projects, select } = useWorkspace();
  const current = links.find((l) => l.href === path);
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <Link href="/" className="brand" aria-label="CivicDT home">
          <span className="brand-mark">
            <svg viewBox="0 0 32 32" aria-hidden="true">
              <path
                d="M5 12 16 6l11 6v13L16 31 5 25Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="m5 12 11 6 11-6M16 18v13M10 9l11 6v13"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </span>
          <span>
            Civic<span className="brand-light">DT</span>
            <small>PLANNING WORKSPACE</small>
          </span>
        </Link>
        <div className="workspace-label">
          <span className="workspace-avatar">C</span>
          <span>
            Community planning<small>Local workspace</small>
          </span>
          <span className="status-dot" />
        </div>
        <p className="nav-label">WORKSPACE</p>
        <nav aria-label="Main navigation">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-item ${path === href ? "active" : ""}`}
              aria-current={path === href ? "page" : undefined}
            >
              <Icon size={18} />
              {label}
              {href === "/analysis" && <span className="nav-plus">+</span>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="trust-note">
            <ShieldCheck size={20} />
            <strong>Evidence before inference</strong>
            <p>
              Transparent assumptions.
              <br />
              Traceable calculations.
            </p>
            <Link href="/methodology">
              Explore the methodology <ArrowUpRight size={13} />
            </Link>
          </div>
          <div className="profile">
            <span className="profile-avatar">CP</span>
            <span>
              Community planner<small>Demo workspace</small>
            </span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div>
            <span className="breadcrumb">Workspace</span>
            <span className="slash">/</span>
            <strong>{current?.label ?? "CivicDT"}</strong>
          </div>
          <div className="topbar-right">
            {projects.length > 0 && (
              <select
                aria-label="Active analysis"
                value={active?.id ?? ""}
                onChange={(e) => select(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.result.input.proposal.title}
                  </option>
                ))}
              </select>
            )}
            <span className="mode-badge">
              <span className="status-dot" />{" "}
              {active?.mode === "ai"
                ? "AI extraction used"
                : "Deterministic demo"}
            </span>
            <span className="profile-avatar small">CP</span>
          </div>
        </header>
        <main id="main" className="main-content">
          {notice && (
            <div className="alert" role="status">
              {notice}
            </div>
          )}
          {children}
        </main>
        <footer className="app-footer">
          <span>CivicDT · Decision support, with the assumptions in view.</span>
          <span>Cost model v1.0 · USD · Illustrative inputs</span>
        </footer>
      </div>
    </div>
  );
}
