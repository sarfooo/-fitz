"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { FormEvent, useState } from "react";

import {
  AuthError,
  AuthField,
  AuthInfo,
  AuthShell,
  AuthSubmit,
} from "@/components/auth/AuthShell";
import { createClient } from "@/lib/supabase/client";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

export default function SignupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!USERNAME_RE.test(username)) {
      setError("Username must be 3–30 chars (letters, numbers, underscore).");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { username } },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If email confirmation is off, a session exists now — write username to profiles.
      if (data.session && data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ username })
          .eq("user_id", data.user.id);

        if (profileError) {
          // 23505 = unique_violation — username already taken.
          setError(
            profileError.code === "23505"
              ? "That username is already taken."
              : profileError.message
          );
          return;
        }
        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Email confirmation flow — no session yet. User finishes signup via email link.
      setInfo(
        "Check your email to confirm your account, then log in to set your username."
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      subtitle="Virtual try-on, locked to you"
      title="sign up"
      footer={
        <>
          Already have an account?{" "}
          <Link href="/login" className="terminal-link">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <AuthError message={error} />
        <AuthInfo message={info} />
        <AuthField
          id="username"
          label="Username"
          value={username}
          onChange={setUsername}
          autoComplete="username"
          required
          minLength={3}
          placeholder="icybaby2000"
          disabled={loading}
        />
        <AuthField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={setEmail}
          autoComplete="email"
          required
          placeholder="you@domain.com"
          disabled={loading}
        />
        <AuthField
          id="password"
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          required
          minLength={8}
          placeholder="at least 8 characters"
          disabled={loading}
        />
        <AuthSubmit loading={loading}>Create account</AuthSubmit>
      </form>
    </AuthShell>
  );
}
