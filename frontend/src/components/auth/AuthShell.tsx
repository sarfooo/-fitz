"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

type Tone = "ok" | "dim" | "warn";
interface BootLine {
  text: string;
  tone: Tone;
}

const BOOT_LINES: BootLine[] = [
  { text: "fitz OS v1.0.3 — (c) 2004 fitz corp.", tone: "dim" },
  { text: "booting auth module........ [ OK ]", tone: "ok" },
  { text: "linking supabase socket.... [ OK ]", tone: "ok" },
  { text: "session handshake.......... [ OK ]", tone: "ok" },
  { text: "awaiting user input_", tone: "dim" },
];

// Types the provided lines one character at a time, then reports done.
function useTypedSequence(lines: BootLine[], charSpeed = 9, lineDelay = 90) {
  const [lineIdx, setLineIdx] = useState(0);
  const [displayed, setDisplayed] = useState<string[]>(() =>
    lines.map(() => "")
  );
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (lineIdx >= lines.length) {
      setDone(true);
      return;
    }
    const line = lines[lineIdx].text;
    let charIdx = 0;
    const interval = window.setInterval(() => {
      charIdx++;
      setDisplayed((prev) => {
        const next = prev.slice();
        next[lineIdx] = line.slice(0, charIdx);
        return next;
      });
      if (charIdx >= line.length) {
        window.clearInterval(interval);
        window.setTimeout(() => setLineIdx((i) => i + 1), lineDelay);
      }
    }, charSpeed);
    return () => window.clearInterval(interval);
  }, [lineIdx, lines, charSpeed, lineDelay]);

  return { displayed, done, activeLine: lineIdx };
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  const boot = useTypedSequence(BOOT_LINES);

  // Fake clock for the status bar — updates once a second.
  const [clock, setClock] = useState<string>(() => formatClock(new Date()));
  useEffect(() => {
    const id = window.setInterval(() => setClock(formatClock(new Date())), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="terminal-page min-h-screen flex flex-col items-center justify-center px-4 py-10 relative overflow-hidden">
      <Link
        href="/"
        className="absolute top-4 left-4 z-10 terminal-link"
        style={{ fontFamily: "var(--font-vt323)", fontSize: "18px" }}
      >
        [ ← fitz ]
      </Link>

      <section className="terminal-frame crt">
        <div className="terminal-titlebar">
          <span className="flex items-center">
            <span className="dots" aria-hidden>
              <span />
              <span />
              <span />
            </span>
            fitz.sh — bash — 80×24
          </span>
          <span>_ □ ×</span>
        </div>

        <div className="terminal-body">
          <div className="terminal-boot" aria-hidden>
            {BOOT_LINES.map((line, i) => {
              const text = boot.displayed[i];
              const isActive = boot.activeLine === i && !boot.done;
              return (
                <div key={line.text} className={`terminal-boot-line ${line.tone}`}>
                  <span className="prefix">&gt;</span>
                  <span>{text}</span>
                  {isActive ? <span className="terminal-caret-inline" /> : null}
                </div>
              );
            })}
          </div>

          {boot.done ? (
            <div className="terminal-reveal" key="reveal">
              <p className="terminal-comment"># {subtitle}</p>
              <h1 className="terminal-title">
                {title}
                <span className="terminal-caret" aria-hidden />
              </h1>
              {children}
              <div
                className="mt-6 text-center terminal-comment"
                style={{ fontSize: "16px" }}
              >
                {footer}
              </div>
            </div>
          ) : null}
        </div>

        <div className="terminal-statusbar">
          <span>
            <span className="led" aria-hidden />
            {boot.done ? "STATUS: READY" : "STATUS: BOOT"}
          </span>
          <span>MEM: 640K</span>
          <span>{clock}</span>
        </div>
      </section>
    </main>
  );
}

function formatClock(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

interface AuthFieldProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  disabled?: boolean;
}

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  autoComplete,
  required,
  minLength,
  placeholder,
  disabled,
}: AuthFieldProps) {
  return (
    <div className="terminal-line">
      <label htmlFor={id} className="terminal-label">
        {label}:
      </label>
      <span className="terminal-prompt" aria-hidden>
        &gt;
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        disabled={disabled}
        className="terminal-input"
      />
    </div>
  );
}

interface AuthErrorProps {
  message: string | null;
}

export function AuthError({ message }: AuthErrorProps) {
  if (!message) return null;
  return (
    <div role="alert" className="terminal-err">
      ! ERROR: {message}
    </div>
  );
}

interface AuthInfoProps {
  message: string | null;
}

export function AuthInfo({ message }: AuthInfoProps) {
  if (!message) return null;
  return (
    <div role="status" className="terminal-info">
      [ OK ] {message}
    </div>
  );
}

interface AuthSubmitProps {
  loading: boolean;
  children: ReactNode;
}

export function AuthSubmit({ loading, children }: AuthSubmitProps) {
  const [dots, setDots] = useState<string>("");

  useEffect(() => {
    if (!loading) {
      setDots("");
      return;
    }
    const id = window.setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : `${d}.`));
    }, 260);
    return () => window.clearInterval(id);
  }, [loading]);

  const label = useMemo(
    () => (loading ? `processing${dots}` : <>[ {children} ]</>),
    [loading, dots, children]
  );

  return (
    <button type="submit" disabled={loading} className="terminal-btn mt-4">
      {label}
    </button>
  );
}
