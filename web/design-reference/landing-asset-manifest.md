# OmniXtra — Landing Page Asset Manifest

Converted from the `asset-manifest.docx` draft and **reconciled against the actual files**
in `OmniXtra-Assets.zip` (manually exported from Figma). For the coding agent building the
Landing page. *(Updated 2026-09-20 for the corrected draft + zip.)*

## How to read this
- **Two kinds of files:**
  - **Screenshot (reference)** = full-section render, the *visual target*. **Do not ship it** — build the section to match it. Saved under `web/design-reference/screens/landing/`.
  - **Asset (embed)** = real image/vector the app renders. Saved under `web/public/images/landing/`, referenced in code as `/images/landing/<file>`.
- **Node IDs:** none — assets were **manually exported** (Figma MCP was rate-limited), so there are no Figma node IDs to cite.
- Filenames below are the **corrected/actual** ones from the zip. Where the draft still differs, it's flagged in **Reconciliation notes**.

## ✅ Applied from this correction round
- **Section 8 "Background Frame":** was the missing `section_2_frame.png`; draft now points to **`section_2_background`** → **resolved** (maps to `section_2_background.jpg`).
- **Section 7 "Background Frame":** changed `section_6_frame` → **`section_5_frame`** (`section_5_frame.jpg`).
- **`image 9.png`** removed from the bundle (was the unlabeled extra) — no longer extracted.
- **`section_7_image.png`** added to the bundle (new) — see ⚠️ below.

## ⚠️ Reconciliation notes (draft vs actual files) — read before wiring up

| Draft referenced | Actual file in zip | Fix applied |
|---|---|---|
| `section_2_background.png` | `section_2_background.jpg` | extension corrected `.png → .jpg` |
| `section_5_frame.png` | `section_5_frame.jpg` | extension corrected `.png → .jpg` |
| `section_6_frame.png` | `section_6_frame.jpg` | extension corrected `.png → .jpg` |
| `Omnixtra_logo.svg` | `OmniXtra_logo.svg` | casing corrected (matters on Linux/CI) |
| `Omnixtra_logo_brand.svg` | `OmniXtra_logo_brand.svg` | casing corrected |

**Still needs a decision:**
- ⚠️ **`section_7_image.png` is new in the zip but the draft still lists Section 7's "Right Side Image" as `section_5_image.png`.** The dedicated file strongly implies Section 7 should now use **`section_7_image.png`**. I've listed it as the recommended source below — **confirm** (otherwise Section 7 reuses `section_5_image.png` as the draft literally says).
- ⚠️ **`Rectangle.png`** (2.5 MB) is in the zip but **not referenced** by the draft. Extracted to `/images/landing/Rectangle.png`; purpose unconfirmed (likely a large background raster).

---

## Brand

| Item | File (asset) | Path | Notes |
|---|---|---|---|
| Logo (mark) | `OmniXtra_logo.svg` | `/images/landing/OmniXtra_logo.svg` | Vector. Primary logo/mark. |
| Logo + brand name (lockup) | `OmniXtra_logo_brand.svg` | `/images/landing/OmniXtra_logo_brand.svg` | Vector full lockup. |

---

## Landing page — full reference
| Item | Type | File | Path |
|---|---|---|---|
| Whole landing page render | Screenshot (reference) | `landing_page.png` | `design-reference/screens/landing/landing_page.png` |

## Section-by-section
Legend: **S** = screenshot (reference target) · **A** = asset (embed).

### Header
| Item | Type | File | Path |
|---|---|---|---|
| Header render | S | `header_hero_section.png` | `design-reference/screens/landing/header_hero_section.png` |
| Logo | A | `OmniXtra_logo.svg` | `/images/landing/OmniXtra_logo.svg` |
| Logo + brand name | A | `OmniXtra_logo_brand.svg` | `/images/landing/OmniXtra_logo_brand.svg` |

### Section 1 — Hero
| Item | Type | File | Path |
|---|---|---|---|
| Hero render | S | `header_hero_section.png` | `design-reference/screens/landing/header_hero_section.png` |
| Hero right-side image | A | `hero-right.png` | `/images/landing/hero-right.png` |

### Section 2 — Welcome Back
| Item | Type | File | Path |
|---|---|---|---|
| Section render | S | `header_hero_section.png` | `design-reference/screens/landing/header_hero_section.png` |
| Section background | A | `section_2_background.jpg` | `/images/landing/section_2_background.jpg` |
| Center image | A | `section_2_image.png` | `/images/landing/section_2_image.png` |

### Section 3 — The Platform
| Item | Type | File | Path |
|---|---|---|---|
| Section render | S | `section_3.png` | `design-reference/screens/landing/section_3.png` |
| Avatars (7) | A | `memoji-1.png` … `memoji-7.png` | `/images/landing/memoji-1.png` … `/images/landing/memoji-7.png` |

### Section 4 — How it works
| Item | Type | File | Path |
|---|---|---|---|
| Section render | S | `section_4.png` | `design-reference/screens/landing/section_4.png` |

### Section 5 — Academy Operations
| Item | Type | File | Path |
|---|---|---|---|
| Section render | S | `section_5.png` | `design-reference/screens/landing/section_5.png` |
| Section background | A | `omnixtra_pattern.svg` | `/images/landing/omnixtra_pattern.svg` |
| Background frame | A | `section_5_frame.jpg` | `/images/landing/section_5_frame.jpg` |
| Right-side image | A | `section_5_image.png` | `/images/landing/section_5_image.png` |

### Section 6 — Branded Academy
| Item | Type | File | Path |
|---|---|---|---|
| Section render | S | `section_6.png` | `design-reference/screens/landing/section_6.png` |
| Background frame | A | `section_6_frame.jpg` | `/images/landing/section_6_frame.jpg` |
| Left-side image | A | `section_2_image.png` *(reused)* | `/images/landing/section_2_image.png` |

### Section 7 — Course Creation
| Item | Type | File | Path |
|---|---|---|---|
| Section render | S | `section_7.png` | `design-reference/screens/landing/section_7.png` |
| Section background | A | `omnixtra_pattern.svg` *(reused)* | `/images/landing/omnixtra_pattern.svg` |
| Background frame | A | `section_5_frame.jpg` *(reused; corrected from section_6_frame)* | `/images/landing/section_5_frame.jpg` |
| Right-side image | A | `section_7_image.png` ⚠️ *(new; draft still says `section_5_image.png` — confirm)* | `/images/landing/section_7_image.png` |

### Section 8 — Learner Experience
| Item | Type | File | Path |
|---|---|---|---|
| Section render | S | `section_8.png` | `design-reference/screens/landing/section_8.png` |
| Background frame | A | `section_2_background.jpg` *(corrected from missing section_2_frame)* | `/images/landing/section_2_background.jpg` |
| Left-side image | A | `section_8_image.png` | `/images/landing/section_8_image.png` |

### Section 9 — AI Tutor
| Item | Type | File | Path |
|---|---|---|---|
| Section render | S | `section_9.png` | `design-reference/screens/landing/section_9.png` |
| Section background | A | `omnixtra_pattern.svg` *(reused)* | `/images/landing/omnixtra_pattern.svg` |

### Section 10 — FAQ
| Item | Type | File | Path |
|---|---|---|---|
| Section render | S | `section_10.png` | `design-reference/screens/landing/section_10.png` |
| Section background | A | `omnixtra_pattern.svg` *(reused)* | `/images/landing/omnixtra_pattern.svg` |

### Section 11 — "Your academy can start…" (footer CTA)
| Item | Type | File | Path |
|---|---|---|---|
| Section render | S | `footer_section.png` | `design-reference/screens/landing/footer_section.png` |
| Section background | A | `section_2_background.jpg` *(reused)* | `/images/landing/section_2_background.jpg` |
| Right-side image | A | `section_2_image.png` *(reused)* | `/images/landing/section_2_image.png` |

---

## Reused assets (bind once, reference in multiple sections)
- `omnixtra_pattern.svg` → sections 5, 7, 9, 10
- `section_2_image.png` → sections 2, 6, 11
- `section_2_background.jpg` → sections 2, 8, 11
- `section_5_frame.jpg` → sections 5, 7
- `section_5_image.png` → section 5 *(and Section 7 only if `section_7_image.png` is not adopted)*
- `section_6_frame.jpg` → section 6 *(no longer used by Section 7)*

## Format / handling notes for the builder
- **Vectors (`.svg`):** `OmniXtra_logo.svg`, `OmniXtra_logo_brand.svg`, `omnixtra_pattern.svg` — embed inline or `<img>`; don't rasterize.
- **`omnixtra_pattern.svg` is 3.4 MB** — heavy for an SVG; consider optimizing (SVGO) or lazy-loading where it's a background.
- **Rasters:** `.png` for transparency (memojis, product images), `.jpg` for photographic backgrounds. User-exported (assume high-res; no separate @2x variants provided).
- **Icons are NOT in this bundle** — UI icons map **Vuesax → Lucide** (use the library); see the component/icon manifest.

## Source
- `asset-manifest.docx` (corrected draft) + `OmniXtra-Assets.zip` (manually exported from the OmniXtra Figma **Landing** design). Reconciled and extracted 2026-09-20.
- **Landing page only.** Dashboard, login, get-started, join, courses, members, my-courses, and course-player screens are **not in this bundle** and remain to be exported.
