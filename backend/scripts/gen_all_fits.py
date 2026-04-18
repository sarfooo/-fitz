"""Enumerate every (shirt × pants) combination in /outfits/ and produce a
try-on render for each. Runs gen_tryon.py as a subprocess so each fit is
atomic and a failure on one doesn't kill the batch.

Usage from backend/:
    PYTHONPATH=. ./venv/bin/python scripts/gen_all_fits.py
    PYTHONPATH=. ./venv/bin/python scripts/gen_all_fits.py --name avatar2
"""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
OUTFITS_DIR = REPO_ROOT / "outfits"
BACKEND_DIR = Path(__file__).resolve().parents[1]
OUT_DIR = BACKEND_DIR / "out"

EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def _list_usable(dir_path: Path) -> list[Path]:
    if not dir_path.is_dir():
        return []
    out: list[Path] = []
    for p in sorted(dir_path.iterdir()):
        if p.suffix.lower() not in EXTS:
            continue
        head = p.read_bytes()[:8]
        if head.startswith(b"\xef\xbf\xbd"):
            continue  # known-corrupt
        out.append(p)
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", default="avatar", help="avatar basename")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    shirts = _list_usable(OUTFITS_DIR / "shirt")
    pants = _list_usable(OUTFITS_DIR / "pants")

    if not shirts or not pants:
        raise SystemExit(
            f"need at least one shirt and one pants in {OUTFITS_DIR}; "
            f"found {len(shirts)} shirts, {len(pants)} pants"
        )

    total = len(shirts) * len(pants)
    print(f"sweeping {total} combination(s): {len(shirts)} shirts × {len(pants)} pants")
    for i, s in enumerate(shirts):
        for j, p in enumerate(pants):
            idx = i * len(pants) + j + 1
            fit_id = f"{s.stem}__{p.stem}"
            out_file = OUT_DIR / f"{args.name}_fit_{fit_id}.png"

            if out_file.exists():
                print(f"[{idx}/{total}] SKIP existing: {out_file.name}")
                continue

            cmd = [
                sys.executable,
                "scripts/gen_tryon.py",
                "--name",
                args.name,
                "--shirt",
                str(s),
                "--pants",
                str(p),
                "--fit-id",
                fit_id,
            ]
            print(f"\n[{idx}/{total}] {fit_id}")
            if args.dry_run:
                print("  (dry) " + " ".join(cmd))
                continue
            result = subprocess.run(cmd, cwd=BACKEND_DIR, env={**__import__("os").environ, "PYTHONPATH": "."})
            if result.returncode != 0:
                print(f"  FAILED (exit {result.returncode}) — continuing with the rest")


if __name__ == "__main__":
    main()
