# Frontend design

The client should look like a small editorial studio, not a generic dashboard. Quiet paper, ink text, one brass accent, and four photographs. Motion is limited to a short fade when the result appears.

## 1. Frame

* Content column max **72rem**, centered, page padding **1.5rem** ( **2.5rem** from **960px** up).
* Header: wordmark **Short** in Fraunces, and a single line “Create a link. Open it later.”
* Hero row at **≥960px**: copy and form on the left, photograph on the right. Below **960px** the photograph sits above the form, full column width.
* Result card directly under the form. Before the first success it is hidden.
* Then the three-step row, then a short footer: “Short links are served by the API. Opening one leaves this page.”

Corners **8px**. Hairline borders use the line color. Shadows are a soft ink at low opacity, one layer, no glow.

## 2. Color and type

| Token | Value | Use |
|:------|:------|:----|
| `--paper` | `#f6f1e8` | Page |
| `--paper-raised` | `#fffaf3` | Form and result card |
| `--ink` | `#1c1915` | Text |
| `--ink-soft` | `#5c564c` | Secondary text |
| `--line` | `#e4d9c8` | Borders |
| `--brass` | `#9a6b3f` | Primary button, focus ring, step numbers |
| `--brass-ink` | `#fffaf3` | Text on the brass button |
| `--danger` | `#8f2d2d` | Error text |
| `--ok` | `#2f5d50` | “Copied” |

* Headlines and the wordmark: **Fraunces** (optical size around 48 for the hero title).
* UI and body: **Source Sans 3**.
* Hero title about **3rem**, line-height **1.15**. Body **1.0625rem**.
* Buttons and inputs share **0.95rem**, input height about **3rem**, brass focus ring **2px**.
* Primary button is brass with `--brass-ink` label. The open action is an ink text button with a brass underline. Do not use a second filled color.

Respect `prefers-reduced-motion`: skip the result fade.

## 3. Pictures

Photographs, natural light, no words baked into the image, no logos, no screenshots of this app. Store them in `frontend/src/assets/` as WebP. The markup sets `alt` as below. Decorative cropping uses `object-fit: cover`.

| File | Ratio | Placement | Picture | Alt text |
|:-----|:------|:----------|:--------|:---------|
| `hero-desk.webp` | 16:9 | Hero | Overhead of a pale oak desk, a closed linen notebook, a brass pen, and a narrow paper strip, warm daylight from the left | “Desk with a notebook, a brass pen, and a paper strip” |
| `step-paste.webp` | 4:3 | Step 1 | Hands sliding a long folded letter into a shallow wooden tray | “Hands placing a long letter into a tray” |
| `step-code.webp` | 4:3 | Step 2 | Close letterpress type, a few metal sorts inked, resting on cream paper | “Metal letterpress type on cream paper” |
| `step-open.webp` | 4:3 | Step 3 | An open doorway from a dim hall into bright daylight, a path continuing outside | “Open doorway leading into daylight” |

Do not hotlink remote images. Do not substitute icons for these four pictures. A broken asset still leaves the heading and the sentence, so the steps remain understandable.

## 4. Form and result

* One column inside the card. Labels above fields: “Long URL”, “Lifetime in days (optional)”.
* Helper under lifetime: “Leave blank for 2 years. Whole days from 1 to 3650.”
* Submit label: **Create short link**. While the request is in flight: **Creating…**, button disabled.
* Errors sit under the form in `--danger`, associated with the form via `aria-describedby` when they come from validation or **400**.
* Result: Fraunces line “Short link ready”, the short URL in a selectable mono-spaced stack (Source Sans 3 is acceptable if a mono face is not loaded), expiry, then the long URL in `--ink-soft`.
* **Copy short link** and **Open short link** on one row, wrapping on narrow widths.

## 5. Empty and narrow

* First view has no fake short code and no sample metrics.
* At about **390px** width the hero image remains visible, the form is full width, and the three steps stack.
* The unknown-route view reuses the paper background, the wordmark, and one sentence with a link back to `/`. No extra photograph.
