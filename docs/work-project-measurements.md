# Work and project template: source measurements

Source: public HTML, CSS and behavior inspection of `https://www.rejouice.com/work` and `https://www.rejouice.com/work/rivian`, captured 2026-11-03. These are measurements for an independent React implementation. The original compiled scripts are not application dependencies.

## Shared units

- Source uses Suisse Intl Light (300) and Regular (400).
- Root font size: `2.667vw` below 768px (10px at 375px); 10px at 768px and wider.
- Desktop breakpoint: 1024px. Desktop grid: 12 columns, 20px gaps, 40px side margins. Mobile grid: 6 columns, 4px gaps, 10px side margins (all mobile measures scale with source rem).
- Core colors: black `#000`, white `#fff`; divider `#747474`; subdued list names opacity `.5`.

## /work

### Intro

- White background and black text.
- Height `90svh`; content aligned to bottom.
- Padding: mobile `0 1rem 6rem`, desktop `0 4rem 10rem`.
- Large statement: mobile 26px / 28px, weight 300, tracking -0.39px. At 768px+: font-size `min(4.306vw,82.667px)`, line-height `min(4.653vw,89.333px)`, tracking `min(-.065vw,-1.24px)`.
- Desktop first-line indent is a floated spacer `min(15.278vw,293.333px)` wide, 20px high.

### Full view, desktop

- Black section contains 23 ordered slides: 19 project covers and 4 text statements.
- Project slides contribute 100vh each; text statements contribute 75vh each. Total source sizer: 2200vh.
- Viewport sticks at top, is 100vh high, clips overflow.
- Project cover fills viewport with `object-fit: cover`.
- Text is centered in the viewport with padding `100px 280px`; font 62px / 66.938px, weight 300, tracking -0.93px.
- Project index is bottom-right, 28px from each edge, uses tabular digits.
- On scroll, slides move vertically. Media and titles move at different rates to create depth. Source media vertical offset varies approximately from -50% to +50%; text offset approximately -40% to +40%, relative to the slide progression. Cover opacity varies around the visible center, with a peak of 1.
- Controls overlay is noninteractive except for its button, positioned at the bottom-left with `28px 40px` inset and sticky viewport tracking.
- Toggle is a pill, 1px 50%-white border, `10px 20px` padding, 10px gap, 14px text, `mix-blend-mode: difference`.
- Toggle glyph is two 3px dots arranged vertically in a 9px box. Hover collapses the dots and reveals a 9px outlined circle.

### List view, desktop

- Full-screen cover composition scales down to a 211px-wide thumbnail positioned 40px from the left and vertically centered. The actual preview preserves the stage ratio: height = `stageHeight × 211 / stageWidth`. The source's 211:121 reference box only supplies the target width. A later live DOM check measured 211×146.510px for stage 1348×936; this supersedes the initial approximate 211×121 capture note.
- The vertical list of all project titles is centered horizontally. Font: 62px / 66.938px, weight 300, tracking -0.93px.
- Active/centered item is white. Others have opacity .5. Hovered name is white with a left-to-right 2px underline.
- Current project index is aligned right at 40px and vertically centered.
- Titles form a looping list. Wheel and vertical dragging control its position. The displayed thumbnail follows the hovered name, otherwise the centered name. Drag release carries momentum.
- Full→List transition: viewport morph duration 1.2s, fast ease-in-out; list items enter from +100% y with 1.3s expo-out and .02s stagger beginning at .5s; full-view labels fade out.
- List→Full transition: list names leave upward with .7s transition and .015s stagger; viewport expands over 1.2s expo-in-out; full labels return at .8s. The selected project is kept in view.
- Background page scroll is stopped while the looping list is active and restored on leaving the mode/page.

### Mobile

- List view and its toggle are hidden.
- Natural page scroll through square image cards.
- Title bottom-left: 16px / 18.24px, tracking -0.24px. Source CSS declares `left:1rem; bottom:1.5rem`; root's live mobile capture showed approximately 24px bottom inset, which the implementation follows.
- Index bottom-right: same baseline, `right:1rem`.
- Statements are black blocks with centered 16px text and generous horizontal padding.
- The standard site footer follows the gallery.

## /work/:slug

### Hero

- Full viewport hero (`100svh`), cover image/video fills the container.
- As hero leaves the viewport, media translates downward to +50% of its height; container clips it.
- Project name is semantic, visually hidden in the source. Visible hero caption is separate.
- Desktop: 12-column layout, caption spans columns 7–12, aligned to bottom with 70px spacing; font 62px / 66.938px, weight 300, tracking -0.93px.
- Mobile: caption absolute left 10px, bottom 40px, width 210px; font 26px / 28px, tracking -0.39px.
- Hero caption animates words with .04s stagger and .2s initial delay.

### Introduction

- White background. Horizontal page inset: 40px desktop / 10px mobile.
- Desktop intro padding `70px 0 220px`; roles span columns 1–6; copy spans columns 7–10. Both font 20px / 24px, weight 300, tracking -.2px.
- Mobile intro padding `100px 0`; roles and copy stacked; font 16px / 17.5px, weight 400, tracking -.16px; each has 40px bottom spacing.
- Separate paragraphs have 10px bottom spacing.
- Optional external project link follows the copy, with animated arrow/underline.

### Media sequence

- A simple ordered vertical sequence; gap 20px on desktop and mobile.
- Natural asset aspect ratios are preserved. Videos autoplay silently, loop, and play inline; image alternatives and video posters must remain useful while loading.
- The Rivian case has 11 assets: 9 images and 2 videos. Several images are tall; they must not be cropped to 16:9.

### Optional testimonial and awards

- Testimonial: desktop author in columns 1–4, quote in columns 7–10; padding `40px 0 120px`. Portrait is 60px round, 15px right margin. Mobile stacked, padding `40px 0 60px`.
- If testimonial is absent, wrapper receives 200px desktop / 140px mobile bottom spacing.
- Awards: top border .7px `#747474`, desktop padding `40px 0 130px`; label columns 1–3, entries columns 7–9; mobile padding `20px 0 60px`.
- Awards label desktop: 26.5px / 27.5px, tracking -.795px. Entry markers: two 5px black circles, 3px gap, subtle crossing hover.

### Next project

- There is no global footer on project pages.
- Top separator .7px `#747474`, within horizontal page inset.
- Padding: desktop `20px 40px 40px`; mobile `20px 10px`.
- Top line: “Next project” left, “All Projects” link right; 5px bottom spacing.
- Image: desktop 1360:765, mobile square; cover fit.
- Image moves from -20% y to 0 as the next-project block enters the viewport.
- Project title is centered over the image, white, underlined, and changes to “See project” on hover with letter movement.
- Title font: desktop 62px / 61px, tracking -.93px; mobile 28px / 33.44px, tracking -.42px.
- Next target is data-driven and may differ from catalogue order (Rivian → Oura Ring).

## Implementation boundaries

- Reimplement behavior in React/TypeScript + GSAP with local media paths.
- No Nuxt runtime, copied compiled bundle, external CMS, analytics or third-party submission endpoint.
- Keep content separate from layout so BAEV text, projects and media can replace the reference set.
- Respect reduced motion, preserve native links/keyboard access and restore scroll on unmount.
- Root agent captured Work Full/List at desktop 1792×860 and mobile 390×844, plus Rivian hero/body on both, before UI implementation. Full mode, List mode, thumbnail position, mobile card geometry and case media spacing were visually confirmed. Final comparison remains a separate implementation check.
