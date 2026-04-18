"use client";

import { Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  type AvatarIdentity,
  captureAvatarIdentity,
} from "@/lib/api/backend";

interface AvatarSetupModalProps {
  open: boolean;
  accessToken: string | null;
  onClose: () => void;
  onCaptured: (avatar: AvatarIdentity) => void;
}

const MAX_FILES = 5;

const PROGRESS_STAGES = [
  { pct: 12, label: "Uploading references" },
  { pct: 28, label: "Analyzing face" },
  { pct: 46, label: "Reading body proportions" },
  { pct: 64, label: "Capturing style signals" },
  { pct: 82, label: "Generating your character" },
  { pct: 94, label: "Finalizing avatar" },
];

export function AvatarSetupModal({
  open,
  accessToken,
  onClose,
  onCaptured,
}: AvatarSetupModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [stageLabel, setStageLabel] = useState<string>("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const submittedRef = useRef(false);

  // Build + revoke object URLs as the selection changes.
  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviews(urls);
    return () => {
      for (const url of urls) URL.revokeObjectURL(url);
    };
  }, [files]);

  useEffect(() => {
    if (!open) {
      setFiles([]);
      setError(null);
      setSubmitting(false);
      setProgress(0);
      setStageLabel("");
      submittedRef.current = false;
    }
  }, [open]);

  // Animate progress while submission is in flight.
  useEffect(() => {
    if (!submitting) return;
    let cancelled = false;
    let stageIndex = 0;

    function advance() {
      if (cancelled) return;
      const stage = PROGRESS_STAGES[stageIndex];
      if (!stage) return;
      setProgress((current) => (current < stage.pct ? stage.pct : current));
      setStageLabel(stage.label);
      stageIndex += 1;
    }

    advance();
    const id = window.setInterval(advance, 1400);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [submitting]);

  if (!open) return null;

  function onPick(selected: FileList | null) {
    if (!selected) return;
    const picked = Array.from(selected)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_FILES);
    setFiles(picked);
    if (picked.length > 0) {
      void submit(picked);
    }
  }

  async function submit(selected: File[]) {
    if (submittedRef.current) return;
    if (selected.length === 0) {
      setError("Pick at least one photo.");
      return;
    }
    if (!accessToken) {
      setError("You need to be logged in.");
      return;
    }
    submittedRef.current = true;
    setSubmitting(true);
    setError(null);
    setProgress(4);
    setStageLabel("Uploading references");
    try {
      const res = await captureAvatarIdentity(accessToken, selected);
      if (!res.success || !res.avatar) {
        setError(res.error || "Failed to capture identity.");
        submittedRef.current = false;
        return;
      }
      setProgress(100);
      setStageLabel("Done");
      onCaptured(res.avatar);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to capture identity.");
      submittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="liquid-glass w-full max-w-lg rounded-xl p-6 relative">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="absolute top-3 right-3 text-white/60 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="close"
        >
          <X size={18} />
        </button>

        <p
          className="neon-pink text-[10px] tracking-[0.35em] uppercase mb-2"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          One-time setup
        </p>
        <h2
          className="chrome-text text-3xl font-black tracking-tight mb-4"
          style={{ fontFamily: "var(--font-retro)" }}
        >
          Capture your look
        </h2>
        <p className="text-sm text-white/70 leading-6 mb-5">
          Upload 1–5 clear photos of yourself (face + body visible, neutral
          background works best). We&apos;ll generate your character the moment
          your photos upload.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
          disabled={submitting}
        />

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={submitting}
          className="w-full border-2 border-dashed border-[color:var(--color-fc-border)] hover:border-[color:var(--color-fc-neon)] disabled:hover:border-[color:var(--color-fc-border)] disabled:opacity-60 disabled:cursor-not-allowed rounded-lg py-6 flex flex-col items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <Upload size={22} />
          <span className="text-sm">
            {files.length === 0
              ? "Click to pick up to 5 photos"
              : `${files.length} photo${files.length === 1 ? "" : "s"} selected`}
          </span>
        </button>

        {previews.length > 0 ? (
          <div className="mt-4 grid grid-cols-5 gap-2">
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={src}
                src={src}
                alt={`ref ${i + 1}`}
                className="w-full aspect-square object-cover rounded border border-[color:var(--color-fc-border)]"
              />
            ))}
          </div>
        ) : null}

        {submitting ? (
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-[10px] tracking-[0.25em] uppercase text-white/70"
                 style={{ fontFamily: "var(--font-mono)" }}>
              <span>{stageLabel || "Working"}</span>
              <span>{Math.min(progress, 99)}%</span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/10 border border-[color:var(--color-fc-border)]">
              <div
                className="h-full transition-[width] duration-700 ease-out"
                style={{
                  width: `${Math.min(progress, 99)}%`,
                  background:
                    "linear-gradient(90deg, var(--color-fc-neon) 0%, var(--color-fc-hot) 100%)",
                  boxShadow: "0 0 12px rgba(201,64,255,0.65)",
                }}
              />
            </div>
            <p className="text-[11px] text-white/50">
              Hang tight — Gemini is studying your photos to build a character
              that matches you.
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 text-xs text-rose-300 border border-rose-400/30 bg-rose-500/10 px-3 py-2">
            {error}
          </div>
        ) : null}

        {!submitting && files.length > 0 && error ? (
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="pill-btn-ghost flex-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => submit(files)}
              className="pill-btn flex-1"
            >
              Try again
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
