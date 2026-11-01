"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {state.error && <p className="adm-error" role="alert">{state.error}</p>}
      {/* React clears a form after each submit: keep the email, and put the cursor on the password. */}
      <label className="adm-field">Email<input name="email" type="email" autoComplete="username" required autoFocus={!state.email} defaultValue={state.email} /></label>
      <label className="adm-field">Password<input name="password" type="password" autoComplete="current-password" required autoFocus={!!state.email} /></label>
      <button type="submit" className="adm-btn primary" style={{ minHeight: 44, fontSize: 15 }} disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
