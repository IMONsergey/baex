# Final verification from a clean checkout

Date: 2026-11-03.

Tested code commit: `c0db7fc429b2e95c54a43b72a360dec27236fc1a`.
Recovered base: `84cefe149fe20e83906263e2ebfee38cafe5a196`.

## Result

The complete reference implementation was restored from GitHub into a new checkout. Installation, TypeScript/content/media verification and production build completed successfully. The temporary comparison helper was removed before the build. The output contains all 25 route entry files and no QA helper pages.

The only application change in this review makes the showreel remember its actual launcher button. Pointer activation can focus a nested video or leave focus elsewhere in some browsers. `HomePage` now passes `event.currentTarget`, `App` retains it through the close animation, and `Reel` restores it only while the button remains connected. The existing modal focus trap and scroll lock remain active until the exit finishes.

## Fresh command results

| Command / check | Observed result |
|---|---|
| `npm ci --prefer-offline --no-audit --no-fund` | Exit 0; 33 packages installed; the remaining split Terminal MP4 assembled locally and offline. |
| `npm run check` | Exit 0; type check, content verification and media hashes passed. |
| Content | 25 routes, 19 projects, 23 Work slides, 203 gallery items, 55 internal links, 338 media references. |
| Media | 412 files, 250,140,547 bytes; zero bad files and zero missing references. |
| `npm run build` | Exit 0; 25 static HTML entries. Full output: [build.txt](build.txt). |
| Output inspection | 25 `index.html` files, no missing manifest entries, no `__qa` / `__sourceqa` pages. |

## Fresh browser observations

Cloud Chrome, desktop CSS viewport 1363 x 936. Responsive mobile checks used a 390 x 844 iframe; this was not physical-device or touch emulation.

The measured observations are saved in [browser-checks.json](browser-checks.json). They include intermediate states as well as completed journeys; the 19 entries are not 19 independent automated tests.

| Journey | Observed result |
|---|---|
| Pointer opens showreel | Local MP4, readyState 4, playback advancing, background videos paused. |
| Pointer then Escape | Dialog removed; focus on `button.home-reel`; scroll remained 842; overflow restored. |
| Enter then Escape | Close button receives modal focus; after exit, focus returns to the launcher; scroll remained 842. |
| Mobile menu | Shift+Tab wraps to LinkedIn; Escape closes the dialog and returns focus to Menu. |
| Mobile Menu -> Work -> ICOMAT | Menu closes, route opens at scroll 0, document width 375 equals scroll width 375, no media errors. |
| Work Full -> List | Full catalogue and list both render; current ICOMAT state captured. |
| List ArrowDown -> Enter | Real focus moves to Tensor; Enter opens `/work/tensor` at scroll 0. |
| Tensor next project | Footer navigation opens Rivian at scroll 0; transition curtain releases input. |
| About -> Services -> Back | About restores exactly 1872px. |
| Forward to Services | Services restores exactly 936px. |
| Venture anchor | `/services#venture`, scroll 5190; anchor top 90px; curtain does not block input. |
| Contact | Opens at scroll 0, no horizontal overflow or media errors. |
| Newsletter | A reserved invalid-domain test address receives the explicit disconnected-reference message. No real subscription is claimed. |

The inspected application console contained no application warnings/errors. The recorded log also contains 44 messages from the browser extension about sending its own metadata; those are distinguished by their `chrome-extension://` source and are not reported as application errors.

One bounded automation wait expired during the normal showreel exit animation; the subsequent state observation confirmed dialog removal, correct focus and restored overflow. Some browser helper calls also hit their runtime deadline. These observations are manual browser checks, not a deterministic browser test suite.

## Visual comparison

An independent reviewer inspected these combined source/implementation images. No actionable P0/P1/P2 mismatch was found in the listed states.

| State | Source and implementation evidence |
|---|---|
| Home desktop | [Combined](home-desktop-verified.jpg), [fresh source](source-home-desktop.jpg), [implementation](implementation-home-desktop.jpg) |
| Home mobile | [Combined](home-mobile-verified.jpg); source is the earlier same-day `../../evidence/source-home-mobile-settled.jpg`, implementation is fresh. |
| Work List / ICOMAT | [Combined](work-list-comparison.jpg), [fresh implementation](work-list-desktop.jpg); source is earlier same-day `../../evidence/source-work-list.jpg`. |
| Tensor hero | [Combined](tensor-comparison.jpg), [fresh implementation](tensor-desktop.jpg); source is earlier same-day `../../evidence/source-tensor-desktop.jpg`. |
| Additional current states | [Full catalogue](work-full-desktop.jpg), [mobile menu](mobile-menu.jpg), [mobile ICOMAT](mobile-icomat.jpg). |

Desktop source screenshots are 1348 x 926 pixels from a 1363 x 936 CSS viewport. Work List implementation is 1363 x 936; Tensor implementation is 1348 x 926. The image comparisons normalize both sides to 1363 x 936 before placing them side by side. Home desktop is displayed at 48% scale in the comparison helper. Mobile source is 390 x 844 pixels and the implementation iframe is 390 x 844 CSS pixels at 1:1. This is a composition review, not a numerical pixel-diff claim.

The current source could be captured in its own tab. Embedding that source in a simultaneous comparison iframe failed in this browser, so the desktop comparison uses the freshly captured image. The older same-day mobile, Work and Tensor source images are identified above rather than presented as new captures.

### Required fidelity surfaces

- Typography: local Suisse Intl, weights, scale and wrapping remain consistent with the reference. Copy is intentionally condensed; it is not a verbatim text archive.
- Spacing: hero height, margins, navigation, list spacing, preview placement and image framing match the compared states. No observed mobile overflow.
- Colors: black/dark surfaces, light text and menu treatment remain consistent.
- Assets: original local wordmarks, photographs, films and covers remain intact. Different animation/video frames are not treated as layout mismatches.
- Content: routes, project order, gallery structure and next-project links are preserved. REJOUICE identity/contact data remain pending the separate BAEV adaptation.

Focused 1:1 evidence is retained in `../../evidence/mobile-header-detail.jpg`, `../../evidence/work-list-detail.jpg` and `../../evidence/contact-type-detail.jpg`; no visual CSS change was made in this review. Current mobile screenshots additionally show the menu, type scale and controls at 1:1.

### Remaining polish and coverage

- P3: mobile wordmark is approximately 4px lower in the compared source/implementation pair; Full view control differs by a few pixels. Neither obstructs use or changes the main composition.
- Physical Safari/iOS/Android and Firefox were not tested in this run.
- Reduced motion was not exercised through an OS preference override.
- No forced chunk-load failure, delayed lazy-import test or every-frame animation comparison was performed.
- All 19 long galleries were structurally/media verified; they were not each manually scrolled end to end.
- Two unavailable source-local Connect Homes blob assets remain documented in `../../source-gaps.json`.
- Public deployment, own-brand content and a real newsletter backend remain outside this reference-edition handoff.

final result: passed
