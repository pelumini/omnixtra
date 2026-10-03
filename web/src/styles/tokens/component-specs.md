# OmniXtra — Component Specs

Spec for a coding agent. **No code.** Values cite the **Figma token name** with the
resolved hex in parentheses so the builder binds to our semantic tokens, not raw hex.

- **Source:** OmniXtra Figma design system — file `jyrYS7IC3Vz0LrQQMpjqwv`, page `🎨 Design System`.
- **Extraction:** `get_metadata` (structure/geometry) + `get_variable_defs` (token bindings) +
  `get_design_context` (exact padding/gap/radius for the read-through variants).
- **Confidence markers:**
  - **[READ]** = taken directly from `get_design_context` on that exact variant node.
  - **[TOKEN-UNION]** = token is confirmed present in the component's frame, but the exact
    per-state/variant binding was inferred (not read one-by-one).
  - **UNRESOLVED — needs manual check** = could not be read (see reason).
- **Extraction was cut short by the Figma MCP Starter-plan rate limit** after the Button and
  Input variants. Badge and Tag geometry (padding/radius) is therefore UNRESOLVED; their
  colors come from the already-captured frame token unions.

---

## ⚠️ Known semantic mismatch — primary is indigo vs blue

Our brand primary is **indigo `#584ce1` (`primitive/light-indigo/500`)**. Two different
"primary" values coexist in this file:

| Where | Token | Resolves to | Verdict |
|---|---|---|---|
| **Button** Primary fill | `primitive/light-indigo/500` | **#584ce1 indigo** | ✅ correct indigo (binds the primitive directly) |
| Button Primary drop-shadow | `button-shadow/stroke/primary` | **#375DFB blue** (rgba(55,93,251,.08)) | ⚠️ blue tint |
| Semantic alias | `primary-base` | **#375dfb blue** | ⚠️ **MISMATCH** — semantic "primary" is blue, not brand indigo |
| Semantic alias | `primary-dark` / `primary-lighter` | `#253ea7` / `#ebf1ff` (blue family) | ⚠️ blue family |

**Flag for builder:** any component that binds `primary-base` / `primary-dark` /
`primary-lighter` (or the `button-shadow/focus/primary` ring `#EBF1FF`) will render **blue
`#375dfb`**, which does **not** match the brand indigo. The Button dodges this by binding the
indigo primitive directly for its fill — but its shadow tint is still blue. Decide whether
`primary-*` semantics should be re-pointed to the `light-indigo` ramp before building.

---

## Button

**Axes (from the Buttons frame):** `Type` = Primary / Neutral / Error · `Style` = Filled /
Stroke / Lighter / Ghost (+ Black / White / Gray / Modifiable seen on link/social sub-families)
· `Size` = X-Small (32) / Small (36) / Medium (40) · `Only Icon` = Off / On · plus
`Underline` and `Full Radius` booleans on the link/icon sub-families.
**States present:** Default, Hover, Focused, Disabled.
**States NOT present in Figma:** `active`/`pressed` and `loading` →
**UNRESOLVED — needs manual check** (no such variant exists; the builder must design these,
they are not specified in the source).
Shape: buttons are **pill / fully-rounded (radius 99px)** by default (confirmed by render).

### Variant: Primary / Filled / Medium (40) — [READ, node 6:28511]
- height: **40px**
- padding: **10 / 10 / 10 / 10** (T/R/L/B); the label has an extra internal `4px` L/R inset
- gap (icon↔label): **4px**
- radius: **99px** (pill)
- background: `primitive/light-indigo/500` (**#584ce1**, indigo)
- text color: `text/white-0` (**#ffffff**)
- typography: `Label/Small` — Mulish SemiBold, 14px / line-height 20px, tracking −0.28px
- icon slots: **left + right** supported, **20×20px** each (chevron `arrow-left/right-s-line`)
- shadow: `button-shadow/stroke/primary` (**#375DFB14** → rgba(55,93,251,0.08)) ⚠️ blue tint
- **States:**
  - hover: background → `primitive/light-indigo/700` (**#3e359e**) **[TOKEN-UNION]** (also a
    `primary-dark #253ea7` is in the frame; exact hover binding UNRESOLVED — rate limit)
  - active/pressed: **UNRESOLVED — not in Figma**
  - focus: fill unchanged + focus ring `button-shadow/focus/primary` (2 rings: `#EBF1FF` spread 4px, `#FFFFFF` spread 2px) **[TOKEN-UNION]** ⚠️ ring tint is blue-family `#EBF1FF`
  - disabled: background `bg/weak-100` (**#f6f8fa**), text `text/disabled-300` (**#cdd0d5**), icon `icon/disabled-300` (**#cdd0d5**) **[TOKEN-UNION]**
  - loading: **UNRESOLVED — not in Figma** (no spinner/loading variant defined)

### Variant: Primary / Filled / Medium — Only Icon = On — [geometry READ, node 6:29135]
- size: **40×40** (square → circle at 99px radius); padding 10px; single 20px icon; same fill/text/shadow tokens as above.

### Other Type × Style token mapping — [TOKEN-UNION; geometry same as above per Size]
Exact per-combo fills were not read individually (rate limit); tokens below are the ones
present in the Buttons frame, mapped by convention:
| Type / Style | Filled bg | Stroke | Lighter bg | Ghost |
|---|---|---|---|---|
| **Primary** (indigo) | `primitive/light-indigo/500` (#584ce1) | bg `bg/white-0` + border `stroke/…` , text indigo | `primitive/light-indigo/50` (#eeedfc) + indigo text | transparent + indigo text |
| **Neutral** (≈"Secondary") | `bg/strong-900` (#0a0d14) | `bg/white-0` + `stroke/soft-200` border + `text/sub-500` | `bg/weak-100` (#f6f8fa) + `text/main-900` | transparent + `text/sub-500` |
| **Error** | `state/error` (#df1c41) / `red/base` | white + `red` border + `red` text | `red/lighter` (#fdedf0) + `red` text | transparent + `red` text |
> "Secondary" per the task ≈ this system's **Neutral** type (and/or the **Stroke** style). Confirm the intended mapping. Per-combo exact fills: **UNRESOLVED — needs manual check** (rate limit).

**Sizes:** Medium (40) read above. Small (36) and X-Small (32) share the token set; their
height = 36 / 32 and reduced padding are **UNRESOLVED — needs manual check** (not read).

---

## Input / Text field

**Axes:** `Type` = Basic / Phone / Website / Password · `Size` = Medium (40) / Small (36) ·
`State` = Placeholder / Hover / Focus / Filled / Error / Disabled.

### Variant: Basic / Medium (40) / Placeholder — [READ, node 8:10317]
Structure = floating **label** (above, overlapping top border) + **field** + **hint text** (below), stacked with 4px gap; wrapper width fills container.
**Field box:**
- height: **40px** (py 10 + 20 content)
- padding: **10 / 10 / 10 / 12** (T / R / B / L)  ·  gap (icon↔text): **8px**
- radius: **10px**
- background: `bg/white-0` (**#ffffff**)
- border: **1px** `stroke/soft-200` (**#e2e4e9**)
- shadow: `regular-shadow/x-small` (**#E4E5E73D** → rgba(228,229,231,0.24))
- placeholder text: `text/soft-400` (**#868c98**), `Paragraph/X Small` — Mulish Regular 12 / 16, tracking −0.24px
- left icon: **16×16** (`user-3-line`) · right icon: **20×20** (`info-custom-fill`)

**Floating label:** `Label/X Small` — Mulish Medium 12/16, color `text/main-900` (**#0a0d14**); "(Optional)" suffix `text/sub-500` (**#525866**); white background chip sitting on the border.
**Hint text:** `Paragraph/X Small`, color `text/sub-500` (**#525866**), 16px leading icon.

### States — [TOKEN-UNION; exact per-state bindings not read individually — rate limit]
All confirmed present in the Text Input frame token union:
- **hover:** border stays `stroke/soft-200`; subtle emphasis. (exact delta UNRESOLVED)
- **focus:** border → `stroke/strong-900` (**#0a0d14**) + focus ring `button-shadow/focus/important` (`#E4E5E7` 4px + `#FFFFFF` 2px); value text `text/main-900` (#0a0d14).
- **filled:** value text `text/main-900` (**#0a0d14**); border `stroke/soft-200`.
- **error:** border → `state/error` (**#df1c41**); hint text → `state/error`; `error-warning-fill` icon. ✅ error is red (correct).
- **disabled:** background `bg/weak-100` (**#f6f8fa**); text `text/disabled-300` (**#cdd0d5**); icon `icon/disabled-300` (**#cdd0d5**).
- **Small (36)** size: height 36 + reduced padding **UNRESOLVED — needs manual check**.

---

## Text Area

Own component (frame `Text Area [Overview]`, instance `Text Area [1.0]`).
- **States:** Default / Hover / Focus / Filled / Disabled / Error (6 variants).
- Overview size **400 × 164** per variant; multiline field.
- Token family mirrors Input (`bg/white-0`, `stroke/soft-200`, `text/soft-400` placeholder,
  `text/main-900` value, `state/error` error, `bg/weak-100` disabled, `regular-shadow/x-small`). **[TOKEN-UNION]**
- Exact padding, radius, min-height, and resize affordance: **UNRESOLVED — needs manual check** (not read; rate limit).

---

## Card

**UNRESOLVED — needs manual check: no Card component exists in this Figma file.**
A full-text scan of the design-system page found only Vuesax **icons** named `card` (e.g.
`vuesax/bold/card`), no Card container/surface component. Background / border / radius /
padding / shadow cannot be specified from the source. If a card is required, the closest
in-system primitives are surface tokens `bg/white-0`, `stroke/soft-200`, `radius-8` (8px),
and the `regular-shadow/*` elevation scale — but this is a **build decision, not an
extracted spec.**

---

## Badge / Status pill  (Figma name: **Status Badge**)

Frame `4:27689`; instance `Status Badge [1.0]`.
**Axes:** `Type` = Icon (leading status icon) / Dot (leading colored dot) · `Status` =
Completed / Pending / Failed / Disabled · `Style` = Default / Lighter.
- height: **24px** (variant box 68×24)
- padding / radius / gap: **UNRESOLVED — needs manual check** (rate-limited before reading
  the badge's internal geometry; `radius-8` = 8px is the likely radius but unconfirmed).

**Status → color mapping** (maps success/Active, pending/Invited, error as requested) — **[TOKEN-UNION]**:
| Status (requested name) | Text / icon / dot | Lighter-style background |
|---|---|---|
| **Completed** (≈ success / Active) | `state/success` (**#38c793**) | `green/lighter` (**#effaf6**) |
| **Pending** (≈ pending / Invited) | `state/warning` (**#f17b2c**) | `orange/lighter` (**#fef3eb**) |
| **Failed** (≈ error) | `state/error` (**#df1c41**) | `red/lighter` (**#fdedf0**) |
| **Disabled** | `state/neutral` (**#868c98**) | `bg/weak-100` (**#f6f8fa**) *(approx — UNRESOLVED)* |

- **Default** style = colored text/icon on white/transparent (border likely `stroke/soft-200`, UNRESOLVED).
- **Lighter** style = colored text/icon on the tinted `*/lighter` background above.

---

## Skeleton / loading placeholder

**UNRESOLVED — needs manual check: no Skeleton / shimmer / loading-placeholder component
exists in this Figma file** (0 matches for skeleton/shimmer). Color, radius, and shape
cannot be specified from the source. If required, it is a build decision — reasonable
in-system defaults would be `bg/weak-100` (#f6f8fa) fill with `radius-8` (8px), but this is
**not extracted.**

---

## Nav item (sidebar)

**UNRESOLVED — needs manual check: no sidebar/nav-item component exists in this Figma file**
(only Vuesax `sidebar-*` / `menu` **icons**). Default / active / hover states cannot be
specified from the source.

---

## Bonus — Tag (closest existing "chip"; not in the requested six but present)

Frame `8:3955`; instance `Tag [1.0]`.
**Axes:** `Style` = Stroke / Gray · `State` = Default / Hover / Active / Disabled ·
`Left Icon` = Off/On · `Dismiss Icon` = Off/On.
- height: **24px** (variant box 37×24 for the no-icon default)
- padding / radius / gap: **UNRESOLVED — needs manual check** (rate limit; `radius-8` likely).
- **Stroke** style: `bg/white-0` (#ffffff) + **1px** `stroke/soft-200` (#e2e4e9), text `text/sub-500` (#525866). **[TOKEN-UNION]**
- **Gray** style: `bg/weak-100` (#f6f8fa), no border, text `text/sub-500` (#525866).
- **hover / active:** step to `bg/weak-100` → `bg/soft-200` (#e2e4e9) **[TOKEN-UNION, inferred]**.
- **disabled:** text/icon `…/disabled-300` (#cdd0d5).

---

## UNRESOLVED summary (for manual check)

1. **Card** — not present in file.
2. **Skeleton / loading placeholder** — not present in file.
3. **Nav item (sidebar)** — not present in file.
4. **Button `active`/`pressed` state** — not present in file.
5. **Button `loading` state** — not present in file (no spinner variant).
6. **Badge & Tag internal geometry** (padding, radius, gap) — Figma MCP Starter-plan rate
   limit hit before these could be read via `get_design_context`.
7. **Per-state exact bindings** for Button (hover/focus/disabled) and Input
   (hover/focus/filled/error/disabled), and **Small/X-Small button + Small input sizes**,
   and **Text Area geometry** — token sets are confirmed present in-frame [TOKEN-UNION] but
   exact per-variant reads were cut off by the rate limit.
8. **Primary color mismatch** — decide whether `primary-base/-dark/-lighter` (blue #375dfb)
   should be re-pointed to the indigo `light-indigo` ramp (#584ce1) before building.

To resolve 6 & 7, re-run `get_design_context` on the specific variant nodes once the Figma
MCP rate limit resets (node IDs are recorded above, e.g. Button hover `6:29051`, focus
`6:28871`, disabled `6:28691`; Input focus `8:10401`, error `8:10569`, disabled `8:10653`,
filled `8:10485`; Badge `4:27761`/`4:27767`/`4:27773`; Tag `8:4041`).

---

## OmniXtra implementation decisions (Stage 2a)

These decisions are canonical for the application implementation and supersede the unresolved
Button/Input choices above:

- Semantic primary remains OmniXtra indigo: `--primary` resolves to `light-indigo/500`
  (`#584ce1`). The exported blue primary semantics are not used for Button styling.
- Primary Button hover uses `light-indigo/700`; pressed/active uses one darker step,
  `light-indigo/800`.
- Button loading preserves the existing disabled spinner and caller-provided pending label.
- Primary Button shadow and focus use the indigo-adjusted component tokens established in
  Stage 1.
- Secondary Button maps to the neutral Stroke style: white background, `stroke/soft-200`
  border, `text/sub-500` text, and `bg/weak-100` on hover.
- Button sizes are Medium (40px), Small (36px), and X-Small (32px). Small and X-Small use
  the same semantic state tokens, with compact 8px and 6px vertical geometry respectively.
- Disabled Button uses `bg/weak-100` with `text/disabled-300`; focus uses the appropriate
  semantic focus ring.
- Input validation remains integrated with React Hook Form. Error messages and borders use
  `state/error`; disabled inputs use `bg/weak-100` and `text/disabled-300`.

## OmniXtra implementation decisions (Stage 2b)

- Card is the canonical white surface: `bg/white-0`, a 1px `stroke/soft-200` border,
  12px radius, 24px padding, and `shadow/x-small`. Adoption across feature screens is
  deferred to Stage 3.
- Badge geometry is 24px high with an 8px radius, 2px vertical padding, 8px horizontal
  padding, and a 4px content gap. It supports Default and Lighter treatments for success,
  pending, error, and neutral statuses using only semantic state and lighter background
  tokens.
- Sidebar Nav items follow the Ghost-button pattern on a white navigation surface. Default
  uses `text/sub-500`; hover uses `bg/weak-100` with `text/main-900`; active uses
  `primary-lighter` with primary text and a 2px left primary accent. Route matching is exact
  for the admin dashboard and prefix-aware for nested destinations.
