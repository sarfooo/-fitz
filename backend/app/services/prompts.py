"""FitCheck prompt builders — enforce the shared visual identity."""

from typing import Literal

FitPreference = Literal["fitted", "regular", "oversized", "baggy"]


HOUSE_STYLE = (
    "photorealistic fashion lookbook photograph, full body shot head to shoes, "
    "subject perfectly centered and facing the camera straight-on, arms relaxed at sides, "
    "neutral calm expression, natural realistic skin texture and hair detail, "
    "very dark near-black seamless studio backdrop with no visible floor line, "
    "deep black charcoal environment with only a faint soft shadow halo behind the subject, "
    "no gray wall, no bright gradient, no visible room edges, "
    "soft even key light with subtle rim light, crisp fabric texture, 50mm lens look, "
    "cohesive FitCheck editorial visual identity"
)

NEGATIVE = (
    "no watermark, no text, no logo overlay, no cartoon, no illustration, "
    "no 3D render look, no plastic skin, no distorted anatomy, no extra limbs, "
    "no blurry face, no cropping of head or feet, no props, no background objects"
)


def build_avatar_from_photo_prompt(
    *,
    num_references: int,
    body_notes: str = "",
    height_cm: int | None = None,
) -> str:
    """Prompt for generating the base avatar from real reference photos.

    The model receives ``num_references`` images of the same real person and
    must produce a single FitCheck-style full-body avatar that preserves the
    person's identity (face shape, hair, skin tone, build) while matching the
    house visual style.
    """
    ref_line = (
        f"The {num_references} reference images show the same real person from different angles."
        if num_references > 1
        else "The reference image shows a real person."
    )
    bits = [
        ref_line,
        "Generate a single full-body avatar of the same person,",
        "preserve their face, hair, skin tone, body type, and build exactly,",
        "wearing a plain fitted neutral base layer (simple t-shirt and pants, solid neutral colors),",
    ]
    if height_cm:
        bits.append(f"subject height approximately {height_cm} cm,")
    if body_notes:
        bits.append(f"body: {body_notes},")
    bits.extend([HOUSE_STYLE + ".", NEGATIVE])
    return " ".join(bits)


def build_avatar_prompt(
    *,
    height_cm: int | None = None,
    body_notes: str = "",
    hair: str = "",
    skin_tone: str = "",
) -> str:
    """Base-avatar prompt: identity layer, no garment."""
    bits = [
        "Portrait of a person in neutral fashion-editorial pose,",
        "wearing plain fitted neutral base layer,",
        HOUSE_STYLE + ".",
    ]
    if height_cm:
        bits.append(f"Subject height approximately {height_cm} cm.")
    if body_notes:
        bits.append(f"Body: {body_notes}.")
    if hair:
        bits.append(f"Hair: {hair}.")
    if skin_tone:
        bits.append(f"Skin tone: {skin_tone}.")
    bits.append(NEGATIVE)
    return " ".join(bits)


def build_outfit_prompt(
    *,
    garment_labels: list[str],
    fit_preference: FitPreference = "regular",
    size_label: str = "",
    layering_notes: str = "",
) -> str:
    """Prompt for multi-image outfit composition.

    The model receives the avatar image first, then one image per garment in
    the same order as ``garment_labels``. We explicitly reference those
    positions so Gemini knows which reference to pull each garment from.
    """
    fit_map = {
        "fitted": "tailored and fitted to the body",
        "regular": "with a natural regular fit",
        "oversized": "loose and oversized silhouette",
        "baggy": "very baggy and slouchy drape",
    }
    ref_lines = [
        f"Reference image {i + 2} is the {label} garment."
        for i, label in enumerate(garment_labels)
    ]
    bits = [
        "Reference image 1 is the person.",
        *ref_lines,
        "Dress the person from image 1 in the garments from the other reference images,",
        f"each garment {fit_map[fit_preference]},",
    ]
    if size_label:
        bits.append(f"shown in size {size_label},")
    if layering_notes:
        bits.append(f"{layering_notes},")
    bits.extend(
        [
            "preserve the person's face, hair, skin tone, and body proportions exactly,",
            "match the garment colors, patterns, and silhouettes from the reference images,",
            HOUSE_STYLE + ".",
            NEGATIVE,
        ]
    )
    return " ".join(bits)


def build_tryon_prompt(
    *,
    item_description: str,
    size_label: str = "",
    fit_preference: FitPreference = "regular",
    layering_notes: str = "",
) -> str:
    """Try-on prompt: fit layer on top of an existing avatar."""
    fit_map = {
        "fitted": "tailored and fitted to the body",
        "regular": "with a natural regular fit",
        "oversized": "loose and oversized silhouette",
        "baggy": "very baggy and slouchy drape",
    }
    bits = [
        f"Same person wearing {item_description},",
        f"garment is {fit_map[fit_preference]},",
    ]
    if size_label:
        bits.append(f"shown in size {size_label},")
    if layering_notes:
        bits.append(f"{layering_notes},")
    bits.append("preserve the person's face, hair, skin tone, and body proportions exactly.")
    bits.append(HOUSE_STYLE + ".")
    bits.append(NEGATIVE)
    return " ".join(bits)
