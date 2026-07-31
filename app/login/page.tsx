import Link from "next/link";
import { loginAction } from "@/app/actions";

export default function LoginPage() {
  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="eyebrow">PromiseGap demo</div>
        <h1>Find the gap between what was promised and what product can prove.</h1>
        <p>Review extracted customer commitments, capability evidence, risk scoring, and accountable next actions in one workspace.</p>
        <div className="trust-strip">
          <span className="trust-chip">AI suggested</span>
          <span className="trust-chip">Human reviewed</span>
          <span className="trust-chip">Verified by Product</span>
        </div>
      </section>
      <section className="auth-card-wrap">
        <div className="card elevated auth-card">
          <div className="eyebrow">PromiseGap</div>
          <h1>Login</h1>
          <p>Use demo credentials: admin@promisegap.demo / PromiseGap123!</p>
          <form className="form" action={loginAction}>
            <label>
              Email
              <input name="email" type="email" defaultValue="admin@promisegap.demo" required />
            </label>
            <label>
              Password
              <input name="password" type="password" defaultValue="PromiseGap123!" required />
            </label>
            <button className="button" type="submit">
              Login
            </button>
          </form>
          <p>
            Need a workspace? <Link href="/signup">Sign up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
