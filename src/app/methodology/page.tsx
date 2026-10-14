"use client";
import { PageHeading } from "@/components/common";
import {
  DEFAULT_ASSUMPTIONS,
  projectLabels,
  formatMoney,
  MODEL_VERSION,
} from "@/lib/engine";
export default function Methodology() {
  return (
    <>
      <PageHeading
        eyebrow="MODEL TRANSPARENCY"
        title="Know what sits behind the numbers."
        description="Transparent arithmetic, explicit assumptions, and honest limits."
      />
      <div className="method-grid">
        <section className="card method-card">
          <p className="eyebrow">01 · THE COST MODEL</p>
          <h3>Simple enough to audit.</h3>
          <p>
            The model compares incremental project spending across three
            scenarios. Corridor miles describe the complete intervention scope;
            they are not lane miles or automatically measured from the map.
          </p>
          <div className="formula-box">
            Construction = quantity × unit cost
            <br />
            Design = construction × design %<br />
            Contingency = (construction + design) × contingency %<br />
            Capital = construction + design + contingency
            <br />
            Annual maintenance = quantity × maintenance unit cost
            <br />
            Horizon total = capital + annual maintenance × years
          </div>
          <p>
            USD throughout. Horizon totals are undiscounted. Existing municipal
            spending, inflation, financing, renewals, land, and unspecified
            utility work are outside the model.
          </p>
        </section>
        <section className="card method-card">
          <p className="eyebrow">02 · UNCERTAINTY</p>
          <h3>A range of assumptions, not a probability.</h3>
          <p>
            Sensitivity varies construction and maintenance unit costs by the
            chosen percentage in both directions. Quantity, design, and
            contingency percentages stay fixed.
          </p>
          <ul>
            <li>Low: unit cost × (1 − sensitivity %)</li>
            <li>Central: the confirmed unit cost</li>
            <li>High: unit cost × (1 + sensitivity %)</li>
          </ul>
          <p>
            These are scenario bounds, not confidence intervals. The model does
            not estimate the probability of each scenario or claim calibrated
            accuracy.
          </p>
        </section>
        <section className="card method-card">
          <p className="eyebrow">03 · AI AND EXTRACTION</p>
          <h3>Language models handle text. Arithmetic handles numbers.</h3>
          <p>
            Optional AI extraction runs only on the server when explicitly
            configured. Each extracted fact must match a supporting source
            passage and pass Zod validation. Unsupported outputs fall back to
            conservative parsing.
          </p>
          <p>
            Without a provider, rule-based demo extraction runs and is labeled.
            Missing scope stays null until supplied; illustrative cost inputs
            require explicit acceptance. No LLM produces cost or impact
            estimates, citations, or policy rankings.
          </p>
        </section>
        <section className="card method-card">
          <p className="eyebrow">04 · EVIDENCE AND IMPACT</p>
          <h3>Costs inform a decision. They do not establish benefits.</h3>
          <p>
            The application does not forecast travel time, ridership, crash
            reduction, deaths prevented, disease, crime, or causal policy
            effects. Access, safety, and operational considerations are
            qualitative.
          </p>
          <p>
            A climate or benefit claim requires a defined counterfactual, local
            activity data, a defensible model, and a measurement plan.
            Alternative treatments can have different service levels; lower cost
            does not establish better value.
          </p>
        </section>
      </div>
      <div className="section-heading">
        <h2>Illustrative starting assumptions</h2>
        <span className="soft-badge">AUTHOR-CREATED · NOT CITY DATA</span>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Intervention</th>
              <th>Proposed construction / unit</th>
              <th>Alternative construction / unit</th>
              <th>Annual maintenance / unit</th>
              <th>Unit</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(DEFAULT_ASSUMPTIONS).map(([type, a]) => (
              <tr key={type}>
                <td>{projectLabels[type as keyof typeof projectLabels]}</td>
                <td>{formatMoney(a.capitalPerUnit)}</td>
                <td>{formatMoney(a.alternativeCapitalPerUnit)}</td>
                <td>
                  {formatMoney(a.annualMaintenancePerUnit)} /{" "}
                  {formatMoney(a.alternativeAnnualMaintenancePerUnit)} (proposed
                  / alternative)
                </td>
                <td>{type === "pedestrian" ? "crossing" : "corridor mile"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="table-footnote">
          Shared defaults: design 15%, contingency 20%, sensitivity ±30%,
          horizon 10 years. Edit every value in the workflow or comparison.
        </p>
      </div>
      <section className="card method-card">
        <h3>Geography, privacy, and reproducibility</h3>
        <p>
          OpenStreetMap supplies the basemap under its{" "}
          <a
            href="https://www.openstreetmap.org/copyright"
            target="_blank"
            rel="noreferrer"
          >
            attribution terms
          </a>
          . Project geometry is an editable sketch. No geocoding or surveyed
          distance is inferred. Public tile requests require network access and
          disclose the viewed geographic area to the tile service.
        </p>
        <p>
          Analyses are stored in this browser’s local storage, with no
          authentication or database. Upload text is processed on the server
          without application persistence. With AI enabled, proposal text is
          sent to the configured provider. Keep confidential documents out of
          the demo.
        </p>
        <p>
          Current cost model: <strong>{MODEL_VERSION}</strong>. Downloaded
          reports revalidate inputs and recompute results, with a fresh UTC
          generation timestamp. Source evidence is preserved with extracted
          fields; planner edits supersede those links.
        </p>
      </section>
    </>
  );
}
