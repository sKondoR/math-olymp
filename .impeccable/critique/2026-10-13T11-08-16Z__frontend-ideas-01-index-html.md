---
target: дизайн 01 палитра море
total_score: 23
max_score: 40
na_heuristics:
p0_count: 1
p1_count: 3
target_identity: "file:C:\\Users\\kondr\\_projects\\_math-olymp\\math-olymp\\frontend-ideas\\01\\index.html"
target_fingerprint: 'sha256:8517139cd4a333531fa4ca8e1ebcec37e5941fe92189c4bf3ef53114e50f9069'
target_path: "C:\\Users\\kondr\\_projects\\_math-olymp\\math-olymp\\frontend-ideas\\01\\index.html"
timestamp: 2026-10-13T11-08-16Z
slug: frontend-ideas-01-index-html
---

# Critique: 01 «Тихий», sea palette (?pal=sea)

Method: dual-agent. Total 23/40 (Acceptable).

| #   | Heuristic        | Score | Key issue                                                 |
| --- | ---------------- | ----- | --------------------------------------------------------- |
| 1   | Status           | 3     | current-task ring #3f9fb3 2.8:1, buried in 5-point group  |
| 2   | Real world       | 2     | points/olympiad jargon, task numbers as index             |
| 3   | Control          | 3     | back, collapse, scroll kept                               |
| 4   | Consistency      | 2     | coral = action and "retry"; № chip vs big numeral; not M3 |
| 5   | Error prevention | 2     | task pictures cropped                                     |
| 6   | Recognition      | 3     | ~half the tiles are bare numbers                          |
| 7   | Flexibility      | 2     | no filter; 99 tasks behind "Показать все"                 |
| 8   | Aesthetic        | 3     | surfaces 1.02–1.14:1 vs page, washed out                  |
| 9   | Error recovery   | 2     | no empty/offline/image-fail states                        |
| 10  | Help             | 1     | nothing explains points/ring/check to non-readers         |

Specificity: mostly category-interchangeable; authored bits = glass art, Kangaroo points grouping, M-A-T-H logo. Sea palette is a leftover of variant 11 without its idea.
Detector: CLI 4 (low-contrast --pick 2.79:1 real; overused-font, flat-type-hierarchy, em-dash = stage FP). Browser 17: real in-phone = low-contrast logo A, cramped-padding on button.more, nested-cards on .next/.resume-home; rest stage chrome.

## Priority issues

- [P0] Task pictures cropped (.next .pic 176px, img height:100% fails; tiles object-fit:cover cuts clocks/calendars). Fix: contain / max-height, no cropping of data-bearing art. → polish
- [P1] Colour roles: coral #f29b85 = "Решать" and "ещё раз"; --pick #f26a1b clashes with coral; sand chip ≈ grade-2 card; --acc2 unused. → colorize
- [P1] Non-text contrast: ring/fill/focus #3f9fb3 2.8:1, fill vs track 2.23, button vs page 1.95, cards 1.02–1.14, --pick on page 2.79. Fix: #1f5d80, 3px + non-colour cue. → colorize, audit
- [P1] Grade screen: ~26 targets, point-named groups, duplicate current ring, bare-number tiles. → distill
- [P2] No reward peak: solved at opacity .42 sorted last; screen opens with failures, ends with grey "show all". → delight

## Personas

Child 7 (non-reader): unreadable labels, 12px "ещё раз", no audio, cropped picture, tempting "Для взрослых". Casey: expanders jump, no scroll cue on retry rail. Sam: aria-label = full task text up to 330 chars; focus 2.8:1; colour-only current state.

## Minor

Uneven 3–4 card meta; EN untested; saturate(.72) dulls glass art; stale descriptions; inconsistent № chips in retry rail.

## Questions

Why "quiet & underwater" for 7-year-olds? Is the 99-tile grid a parent view? Should failures be the second thing a child sees?
