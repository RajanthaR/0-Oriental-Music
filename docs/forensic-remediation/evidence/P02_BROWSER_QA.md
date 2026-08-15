# Phase 2 closeout browser QA baseline

Date: 2026-08-16

State: pre-review implementation baseline; **not final acceptance evidence**

Server: production build served locally with `npm run start -- -p 3017`

## Procedure

Chromium 151 was driven headlessly against `http://127.0.0.1:3017` at 1440×900 and 360×568. Each route recorded HTTP status, document/viewport width, browser console warnings/errors, uncaught page errors, HTTP error responses, and hydration mismatch text. Full-page screenshots and machine-readable results were written outside the repository to:

`C:\tmp\compound-engineering\phase2-browser-qa\pre-review-20260816-final2\`

Routes:

- `/talas`
- `/talas/tala-khemta`
- `/talas/tala-lawani`
- `/talas/tala-dadra`
- `/search`
- `/practice`
- `/lessons/les-intro-01`
- `/lessons/les-tala-dadra`

The interaction pass exercised the verified Tala directory, a distinct zero-result state and clear action, hostile `__proto__` search input, Lawani containment, Khemta retrieval, and real Web Audio controls. Khemta Start was instrumented at its 100 BPM practice value to observe the two delayed compound-stroke timers without cancelling them immediately. The pass then observed the tick replacing only its caller-owned handle and verified Stop, Reset, and audio-off cancellation. A co-mounted `RhythmTapGame` continued from beat 1 to beat 2 while the Tala visualizer started and stopped, demonstrating caller isolation in the production browser.

## Results

| Gate | Result |
|---|---|
| 16 route/viewport combinations returned HTTP 200 | Pass |
| No horizontal overflow at 1440×900 or 360×568 | Pass |
| No console warnings/errors, page errors, HTTP errors, or hydration messages | Pass |
| Reduced Tala directory exposes Khemta but not Dadra, Lawani, or Roopak | Pass |
| Quarantined Tala and Dadra lesson routes render honest unavailable states | Pass |
| Empty/zero-result Tala states are distinct and recoverable | Pass |
| Hostile search key does not throw; Lawani remains absent; Khemta is retrievable | Pass |
| Web Audio available in the test browser | Yes |
| Start preserves initial compound-stroke timers | Pass |
| Tick advances and replaces only the active caller handle | Pass |
| Stop, Reset, and audio-off cancel the active caller handle | Pass |
| Co-mounted rhythm caller continues after Tala Stop | Pass |

## Defects found and closed during the pass

1. A cold browser load requested a missing `/favicon.ico`; a local App Router icon was added and the cold-load matrix was rerun with zero console/HTTP errors.
2. `RhythmTapGame` recreated its interval because `handleFinish` depended on mutable accuracy state. Accuracy scoring now reads a ref, a component regression locks beat advancement/caller isolation, and the production-browser check passes.

## Acceptance boundary

This file preserves the pre-review procedure and result. After the mandatory full review-fix loop accepts an exact HEAD, the same matrix must be rerun and written to an immutable external artifact keyed by that reviewed commit. Changes after that run invalidate the browser acceptance evidence.
