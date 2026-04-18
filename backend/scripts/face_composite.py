"""Composite the avatar's real face onto a generated tryon body.

Usage:
    from face_composite import composite_face
    composite_face(source=avatar_png, target=tryon_png, out=final_png)

Strategy:
    1. Run Haar face detection on the source (real avatar) and target
       (generated body).
    2. Resize the source face crop to match the target face bounding box.
    3. Paste via a feathered elliptical mask so hair and jawline blend in.
"""

from __future__ import annotations

from pathlib import Path

import cv2
import numpy as np

_CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def _detect_face(
    img_bgr: np.ndarray, *, search_top_frac: float = 0.5
) -> tuple[int, int, int, int]:
    """Detect a frontal face. Restricts the search to the top fraction of the
    image so false positives on clothing patches / shoes get excluded."""
    h, w = img_bgr.shape[:2]
    search_h = int(h * search_top_frac)
    gray = cv2.cvtColor(img_bgr[:search_h], cv2.COLOR_BGR2GRAY)
    faces = _CASCADE.detectMultiScale(
        gray, scaleFactor=1.1, minNeighbors=8, minSize=(max(80, w // 12),) * 2
    )
    if len(faces) == 0:
        raise RuntimeError("no face detected")
    # Rank by area * centeredness (horizontal) so we prefer the head near the
    # center column of the frame over spurious side matches.
    img_cx = w / 2

    def score(r: tuple[int, int, int, int]) -> float:
        fx, fy, fw, fh = r
        face_cx = fx + fw / 2
        center_penalty = abs(face_cx - img_cx) / (w / 2)
        return (fw * fh) * (1.0 - 0.5 * center_penalty)

    x, y, fw, fh = max(faces, key=score)
    return int(x), int(y), int(fw), int(fh)


def _expand(
    box: tuple[int, int, int, int],
    *,
    img_w: int,
    img_h: int,
    up: float,
    down: float,
    side: float,
) -> tuple[int, int, int, int]:
    """Expand a face box to include hair (up) and jaw/neck (down)."""
    x, y, w, h = box
    new_x = max(0, int(x - w * side))
    new_y = max(0, int(y - h * up))
    new_r = min(img_w, int(x + w + w * side))
    new_b = min(img_h, int(y + h + h * down))
    return new_x, new_y, new_r - new_x, new_b - new_y


def _feathered_mask(h: int, w: int) -> np.ndarray:
    """Elliptical mask with a soft alpha falloff."""
    mask = np.zeros((h, w), np.uint8)
    cv2.ellipse(
        mask,
        (w // 2, int(h * 0.55)),
        (int(w * 0.45), int(h * 0.48)),
        0,
        0,
        360,
        255,
        -1,
    )
    k = max(15, (min(h, w) // 12) | 1)  # odd kernel size
    mask = cv2.GaussianBlur(mask, (k, k), 0)
    return mask


def composite_face(*, source: Path, target: Path, out: Path) -> None:
    src = cv2.imread(str(source), cv2.IMREAD_COLOR)
    tgt = cv2.imread(str(target), cv2.IMREAD_COLOR)
    if src is None or tgt is None:
        raise SystemExit(f"failed to read images: {source} / {target}")

    # Generous crop on the source so we take forehead + hair + chin.
    src_box = _expand(
        _detect_face(src),
        img_w=src.shape[1],
        img_h=src.shape[0],
        up=1.2,
        down=0.5,
        side=0.5,
    )
    # Tight crop on the target — we overwrite only the face region, keeping
    # its shirt/collar/shoulders intact.
    tgt_box = _expand(
        _detect_face(tgt),
        img_w=tgt.shape[1],
        img_h=tgt.shape[0],
        up=1.0,
        down=0.35,
        side=0.4,
    )

    sx, sy, sw, sh = src_box
    tx, ty, tw, th = tgt_box
    face_src = src[sy : sy + sh, sx : sx + sw]
    face_src_resized = cv2.resize(face_src, (tw, th), interpolation=cv2.INTER_LANCZOS4)

    # Use OpenCV's seamlessClone for a lighting-aware paste. This gradient-
    # domain blend matches skin tone without the heavy LAB color transfer
    # that was tinting results orange.
    mask = _feathered_mask(th, tw)
    center = (tx + tw // 2, ty + th // 2)
    try:
        out_img = cv2.seamlessClone(
            face_src_resized, tgt, mask, center, cv2.NORMAL_CLONE
        )
    except cv2.error:
        # Fallback: straight alpha blend if seamlessClone fails (e.g. mask
        # touches image border).
        mask_f = mask.astype(np.float32) / 255.0
        mask3 = cv2.merge([mask_f, mask_f, mask_f])
        out_img = tgt.copy()
        region = out_img[ty : ty + th, tx : tx + tw].astype(np.float32)
        blended = face_src_resized.astype(np.float32) * mask3 + region * (1 - mask3)
        out_img[ty : ty + th, tx : tx + tw] = blended.astype(np.uint8)

    cv2.imwrite(str(out), out_img)


if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser()
    ap.add_argument("--source", required=True, type=Path, help="real avatar image")
    ap.add_argument("--target", required=True, type=Path, help="generated tryon image")
    ap.add_argument("--out", required=True, type=Path, help="output path")
    args = ap.parse_args()
    composite_face(source=args.source, target=args.target, out=args.out)
    print(f"saved: {args.out}")
