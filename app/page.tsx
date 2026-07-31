import Link from "next/link";

const benefits = [
  "Detect unsupported promises before onboarding",
  "Map customer commitments to verified product evidence",
  "Require human review for risky AI suggestions",
  "Create accountable Product, Sales, CS, and Engineering follow-up"
];

export default function LandingPage() {
  return (
    <>
      <section className="hero">
        <div className="hero-inner">
          <div className="eyebrow">PromiseGap</div>
          <h1>Catch customer promises before they become product escalations.</h1>
          <p>
            PromiseGap helps B2B SaaS teams detect gaps between customer promises and real product capabilities before onboarding failures happen.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/login">
              Open demo
            </Link>
            <Link className="button secondary" href="/case-study">
              View case study
            </Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>75</strong>
              <span>demo promises tracked</span>
            </div>
            <div className="hero-stat">
              <strong>25</strong>
              <span>verified capabilities</span>
            </div>
            <div className="hero-stat">
              <strong>100%</strong>
              <span>works without an AI key</span>
            </div>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-inner grid grid-3">
          <div className="card">
            <div className="eyebrow">Problem</div>
            <h2>Promises scatter across sales, demos, SOWs, and onboarding notes.</h2>
            <p>Teams discover too late that a commitment is partial, custom-only, dependent on configuration, or not actually supported.</p>
          </div>
          <div className="card">
            <div className="eyebrow">How it works</div>
            <h2>Extract, match, score, review.</h2>
            <p>Documents become structured promises, matched to a capability catalogue with explainable confidence and risk scoring.</p>
          </div>
          <div className="card">
            <div className="eyebrow">Trust model</div>
            <h2>AI suggests. Humans decide.</h2>
            <p>No contractual decision is automatic. High-risk promises need owners, evidence, next actions, and human review.</p>
          </div>
        </div>
      </section>
      <section className="section" style={{ background: "#fff" }}>
        <div className="section-inner">
          <h2>Built for cross-functional promise control</h2>
          <div className="grid grid-4" style={{ marginTop: 18 }}>
            {benefits.map((benefit) => (
              <div className="card" key={benefit}>
                <h3>{benefit}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="section-inner comparison">
          <div className="card">
            <div className="eyebrow">Example promise</div>
            <h2>“Employee profile photos will automatically sync from Entra ID, including protected Microsoft Graph photos.”</h2>
          </div>
          <div className="card">
            <div className="eyebrow">PromiseGap result</div>
            <p>Partially supported. Public profile image claims are supported; protected Microsoft Graph photo retrieval is planned. Product review and customer clarification required.</p>
          </div>
        </div>
      </section>
    </>
  );
}
