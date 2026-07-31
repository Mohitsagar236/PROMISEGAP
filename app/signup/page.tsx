import Link from "next/link";
import { signupAction } from "@/app/actions";

export default function SignupPage() {
  return (
    <main className="auth-page">
      <section className="auth-art">
        <div className="eyebrow">New workspace</div>
        <h1>Create a promise review cockpit for your go-to-market team.</h1>
        <p>Start with secure credentials, then load demo data or ingest your own synthetic sample documents.</p>
      </section>
      <section className="auth-card-wrap">
        <div className="card elevated auth-card">
          <div className="eyebrow">PromiseGap</div>
          <h1>Create workspace</h1>
          <form className="form" action={signupAction}>
            <label>
              Name
              <input name="name" required />
            </label>
            <label>
              Work email
              <input name="email" type="email" required />
            </label>
            <label>
              Organization
              <input name="organization" required />
            </label>
            <label>
              Password
              <input name="password" type="password" minLength={8} required />
            </label>
            <button className="button" type="submit">
              Sign up
            </button>
          </form>
          <p>
            Already have an account? <Link href="/login">Login</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
