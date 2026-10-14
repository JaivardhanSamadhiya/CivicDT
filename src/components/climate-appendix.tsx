import { calculateClimate, type ClimateInput } from "@/lib/climate";
export function ClimateAppendix({ input }: { input: ClimateInput }) {
  const result = calculateClimate(input);
  return (
    <section>
      <h3>Conditional climate worksheet · gross tailpipe CO₂ only</h3>
      <p>{result.summary}</p>
      <div className="table-wrap">
        <table>
          <tbody>
            <tr>
              <td>Annual avoided vehicle miles</td>
              <td>
                {input.avoidedMiles === null
                  ? "Unknown"
                  : input.avoidedMiles.toLocaleString("en-US")}
              </td>
            </tr>
            <tr>
              <td>Tailpipe factor · grams CO₂ / vehicle mile</td>
              <td>
                {input.gramsPerMile === null
                  ? "Unknown"
                  : input.gramsPerMile.toLocaleString("en-US")}
              </td>
            </tr>
            <tr>
              <td>Activity basis</td>
              <td>{input.basis} · user-described, unverified</td>
            </tr>
            <tr>
              <td>Emissions-factor source</td>
              <td>{input.factorSource ?? "Not selected"}</td>
            </tr>
            <tr>
              <td>Gross avoided tailpipe tonnes / year</td>
              <td>
                {result.grossAvoidedTailpipeTonnes === null
                  ? "Not calculated"
                  : result.grossAvoidedTailpipeTonnes.toLocaleString("en-US", {
                      maximumSignificantDigits: 4,
                    })}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {input.evidenceNote && <p>Evidence notes: {input.evidenceNote}</p>}
      <ul>
        {result.limitations.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      {result.sources.map((s) => (
        <p key={s.url}>
          <a
            href={s.url}
            className="text-link"
            target="_blank"
            rel="noreferrer"
          >
            {s.title}
          </a>
        </p>
      ))}
      <p>
        Climate arithmetic version: {result.modelVersion}. No uptake, net
        benefit, or causal project impact is inferred.
      </p>
    </section>
  );
}
