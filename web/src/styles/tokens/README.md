# OmniXtra Design Tokens

Production-ready design tokens for the **OmniXtra** design system, derived from Figma
**without changing the design system**. This directory is a deterministic export of a
validated canonical extraction.

---

## Source

**OmniXtra Figma Design System** — file key `jyrYS7IC3Vz0LrQQMpjqwv`, page `🎨 Design System`.

The canonical data originated from the **Figma MCP `get_variable_defs`** tool (plus
`get_metadata` for structure). `get_variable_defs` returns each variable/style as
`name → resolved value` **in the file's current/default mode only**. It does **not**
return collection membership, the full mode list, real alias bindings, or variable scopes
(see [Known limitations](#known-limitations)).

The validated canonical extraction — `omnixtra-canonical-tokens.json` (repo root) — is the
**sole source of truth** for this export and is preserved verbatim here as
[`figma-raw.json`](./figma-raw.json) (the audit artifact — never edit it).

## Pipeline

```text
Figma
  ↓
Figma MCP (get_variable_defs)
  ↓
omnixtra-canonical-tokens.json      ← validated canonical extraction (source of truth)
  ↓
tokens/figma-raw.json               ← byte-identical copy (audit artifact)
  ↓
tokens/tokens.json                  ← production token model (foreign excluded, legacy namespaced)
  ↓
tokens/tokens.css  /  tokens/tokens.ts
```

## Files

| File | Purpose |
|---|---|
| `figma-raw.json` | Byte-identical copy of the canonical extraction. Audit artifact. Includes foreign/legacy entries, provenance, notes, and inferred markers. **Do not modify.** |
| `tokens.json` | Production token model. DTCG-style leaves (`$type`/`$value`/`$ref`). Foreign excluded; legacy namespaced. |
| `tokens.css` | CSS custom properties under `:root`. |
| `tokens.ts` | Strongly-typed `export const tokens = {…} as const;` (+ `Tokens` type). No runtime deps. |
| `README.md` | This document. |

`_meta.json` and `_validation.json` are build/validation side-artifacts and can be ignored or deleted.

---

## Token categories

| Category | Count | What it holds |
|---|---:|---|
| **primitive** | 20 | Raw brand color ramps (`red/green/orange/blue/yellow/teal/purple`, `light-indigo/50–900`) + `radius-8`. |
| **semantic** | 26 | Role tokens: `bg/ text/ icon/ stroke/` neutrals, `primary`, `state/` (success·warning·error·neutral). |
| **component** | 10 | Component-scoped effect styles: `button-shadow/*`, `radio-checkbox-shadow/*`, `toggle-shadow/*`. |
| **typography** | 21 | Mulish text styles (Title, Label, Paragraph, Subheading, Docs). |
| **effect** | 6 | General elevation shadow scale (`x-small → 2x-large`). |
| **legacy** | 2 | Deprecated OmniXtra primitives (`Red Error/100`, `Red Error/200`) under an explicit `legacy` namespace. |

Original Figma names are preserved on every token via `$figmaName`.

---

## Provenance

Every token carries provenance so extracted fact is never confused with inference.

- **Extracted data** (authoritative): `figma_name`, `raw_value`, `resolved_value`
  (current mode), and value `type`. Token **values** in this export are these extracted
  values — unchanged.
- **Inferred metadata** (best-effort, not authoritative): `figma_collection` names,
  the `figma_mode` label, `semantic_category`, and `suggested_code_token`.
- **Unresolved aliases**: where the canonical source marks an alias as
  `{inferred: neutral primitive not surfaced}`, the token keeps its **extracted resolved
  value** and is flagged `"$aliasUnresolved": true`. The missing primitive was **not invented**.
- **Inferred aliases preserved** (4): where a semantic token's value is identical to a
  known primitive and the canonical source records a supported reference
  (`{color.primitive.…}`), the relationship is emitted as a `$ref` (JSON) / `var()` (CSS):
  - `primary-base → light-indigo/500` (verified brand override; raw export incorrectly resolved to blue/base)
  - `state/success → green/base`
  - `state/warning → orange/base`
  - `state/error → red/base`
- **Foreign tokens** (8, excluded from production): tokens that leaked in from the
  *Simple Design System* community library — `Grey/100–600`, `Shades/Black`, and two Inter
  text styles. They remain in `figma-raw.json` but are **not** in `tokens.json/.css/.ts`.
- **Legacy tokens** (2, kept): `Red Error/100`, `Red Error/200` — preserved under the
  `legacy` namespace, superseded by the `red/*` ramp.

### Unresolved neutral aliases (important)

The semantic `bg/`, `text/`, `icon/`, `stroke/` families (plus `primary-lighter`,
`primary-dark`, `state/neutral`) resolve to raw neutral hex values such as `#0a0d14`,
`#525866`, `#868c98`, `#cdd0d5`, `#e2e4e9`, `#f6f8fa`, `#20232d`, `#ffffff`. The underlying
**neutral/gray primitive ramp was not surfaced** by `get_variable_defs`.

We deliberately did **not** manufacture primitives like `color.neutral.900 = #0a0d14` just
because several semantics share that value. These tokens use their extracted value and are
marked `$aliasUnresolved`. 22 semantic tokens are unresolved in this way.

---

## Modes

Only the **single current/default mode** surfaced by `get_variable_defs` was available.
This export is therefore **single-mode** — it is **not** multi-mode.

No dark mode, light mode, high-contrast mode, responsive mode, or alternative theme was
manufactured. If/when additional modes are extracted, they can be layered on without
redesigning the architecture: primitives stay stable, semantics re-point per mode (e.g. a
`[data-theme]` selector overriding the semantic `--color-*` custom properties in
`tokens.css`, or a parallel `semantic` map in `tokens.ts`).

---

## Known limitations

The MCP extraction did **not** provide authoritative:

- **collection membership** — collection names in metadata are inferred from token naming.
- **complete mode lists / per-mode values** — only the current/default mode was returned.
- **real alias bindings** — `get_variable_defs` returns *resolved* values; alias chains are
  collapsed. The 4 aliases above are inferred from identical values, not read from bindings.
- **variable scopes** — not exposed.

Additionally, **neutral primitives** used by the semantic `bg/text/icon/stroke` tokens were
not surfaced and were **not invented**.

To obtain these authoritatively, pull `GET /v1/files/{key}/variables/local` (Figma REST
Variables API, Enterprise-gated) and re-run the export.

### Typography letter-spacing

`letterSpacing` is preserved exactly as Figma reported it (e.g. `-4`, `-1.1`, `+6`) in
**Figma raw units**. The unit (px vs %) could not be proven from the source data, so it was
**not converted**. In `tokens.css` it is emitted as `--font-*-letter-spacing` with a
`/* Figma raw units; unit unverified */` comment; in `tokens.ts` it is the raw number. Do
not treat it as `px` without verifying against the Figma source.

---

## Usage

### CSS

```css
@import "./tokens/tokens.css";

.button-primary {
  background: var(--color-primary-base);   /* → var(--color-light-indigo-500) → #584ce1 */
  color: var(--color-text-white-0);
  border-radius: var(--radius-8);
  box-shadow: var(--shadow-button-focus-primary);
}

.body-text {
  color: var(--color-text-main-900);       /* #0a0d14 (unresolved neutral — extracted value) */
}
```

### TypeScript / React

The `tokens` object mirrors the `tokens.json` hierarchy
(`primitive` / `semantic` / `component` / `typography` / `effect` / `legacy`).

```ts
import { tokens } from "./tokens/tokens";

const styles = {
  color: tokens.semantic.color.primary.base,      // "#584ce1"
  background: tokens.semantic.color.bg["weak-100"],
  boxShadow: tokens.effect.shadow["x-small"],
} as const;

// Typography (letterSpacing is Figma raw units — do not assume px)
const h1 = tokens.typography.title.h1;
// { fontFamily:"Mulish", fontWeight:700, fontSize:"56px", lineHeight:"64px", letterSpacing:-4 }
```

> Note: `tokens.json` separates `primitive`/`semantic`, so the accurate path is
> `tokens.semantic.color.primary.base` (not `tokens.color.primary.base`).

---

## Validation

`tokens.json` is validated against `omnixtra-canonical-tokens.json` on every build:
token counts, missing/unexpected tokens, changed values, foreign leakage, legacy
retention, broken/invented aliases, invented neutral primitives, malformed CSS/JSON,
TypeScript validity, typography drift, effect-conversion correctness, and naming
collisions. Production counts need not equal raw counts because 8 foreign tokens are
intentionally excluded (85 production + 8 foreign = 93 raw). Current status: **PASS**
(`tsc --noEmit --strict` also passes).
