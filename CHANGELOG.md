# Changelog

## 2026-05-08

### Added — academic blog upgrade

- [x] **Paper Review card component** (`quartz/components/PaperReviewCard.tsx`) — auto-renders a metadata card on any post whose frontmatter includes a `paper:` block. Fields: `title`, `authors`, `venue`, `year`, `arxiv`, `doi`, `code`, `pdf`, `project`, `tldr`, `bibkey`. Returns `null` for non-paper posts so it costs nothing on regular notes.
- [x] **Last-modified meta** — `ContentMeta` now renders `Updated <date>` whenever the modified date is at least 1 day later than the created date. Threshold configurable via `modifiedThresholdDays`.
- [x] **BibTeX citations** — wired existing `Plugin.Citations` (rehype-citation) transformer in `quartz.config.ts`. Bibliography file at `content/bibliography.bib`, CSL style `vancouver` (numbered, IEEE-like). Cite in markdown as `[@bibkey]`; references render at the bottom of the post.
- [x] **Bibliography seeded** with 10 cross-checked entries for the existing paper-tagged posts (PAMPC, two Sikang Liu search-based planners, Yang ICRA'21 whole-body, Han RA-L'21 Fast-Racing, Ren ICRA'23, Lee CDC'10 geometric control, SGS-Planner T-Mech'24, Romero T-RO'22 MPCC, Loquercio Sci. Robotics'21).
- [x] **Frontmatter seeded** in all 10 paper-tagged posts with verified `paper:` blocks (authors, venue, year, arXiv ID, DOI, code repo where confirmed, bibkey).
- [x] **About / Publications page** template at `content/about.md` (Bio, Education, Research Interests, Publications, Talks, Awards, Service, Experience, Contact). Linked from `index.md` and the footer.
- [x] **Per-tag RSS feeds** — new emitter `quartz/plugins/emitters/tagFeeds.tsx` produces `tags/<tag>/index.xml` for `paper`, `control-planning`, `RL`, `self-study`. `<link rel="alternate">` tags for each feed are added to every page head.
- [x] **Graph view** enabled in the right sidebar (`Component.Graph()` above ToC).

### Fixed

- [x] `quartz.config.ts` — added missing `locale: "en-US"` and `lightMode.textHighlight` (required by `ColorScheme`).
- [x] `quartz.layout.ts` — moved `afterBody` from `defaultContentPageLayout` to `sharedPageComponents` (correct schema location per `PageLayout` vs `SharedLayout` types).
- [x] `Footer.tsx` — removed unused `version`, `i18n`, and `cfg` references that were tripping `tsc --noEmit`.

### Reviewer fixes (post-review pass)

- [x] **TagFeeds `pubDate` bug** — items without a date no longer fall back to `new Date()`, which was causing every build to emit a fresh timestamp and re-publish stale items as "new" to RSS readers. The `<pubDate>` element is now omitted entirely when no date exists.
- [x] **TagFeeds tag slug normalization** — configured tag names are now passed through `slugTag()` so they match `frontmatter.tags` values that FrontMatter normalizes via the same function. Future tags containing whitespace/`&`/`%` will populate correctly instead of silently emitting empty feeds.
- [x] **PaperReviewCard URL guards** — `pdf`/`code`/`project` fields are now skipped unless `isAbsoluteURL` returns true, preventing relative-path values from producing broken page-relative links.
- [x] **PaperReviewCard authors type guard** — `normalizeAuthors` defensively handles `string`, `string[]`, and rejects other types (e.g. an accidental object would have crashed Preact rendering).
- [x] **PaperReviewCard meta layout** — split the combined "Venue, Year" row into separate `Venue` and `Year` rows so a year-only entry no longer renders the misleading `Venue: 2024`.

### Known behavior

- **"Updated" only renders for posts with explicit `modified:`/`lastmod:`/`updated:`/`last-modified:` frontmatter.** FrontMatter sets `modified ||= created` when the field is absent, so without an explicit value `dates.modified === dates.created` and the threshold check intentionally suppresses the label. To surface git-detected modifications instead, change `Plugin.CreatedModifiedDate` priority to `["git","frontmatter","filesystem"]`.
- Equation auto-numbering not added; KaTeX supports manual `\tag{n}` for now.
- `CustomOgImages` remains disabled (Satori hardcodes Google Fonts; incompatible with `fontOrigin: "local"` Pretendard setup).
- `JetBrains Mono` for code blocks falls back to system mono; can be restored via `@font-face` from a CDN if desired.
- Citations transformer uses `linkCitations: true` and default `suppressBibliography: false`. Posts without any `[@key]` citations are not affected; posts that cite get an auto-rendered bibliography list at the bottom.

### Verified

- `npx tsc --noEmit` clean.
- `npx quartz build` emits 457 files (was 451 before tag feeds + about page).
- Spot-checked rendered HTML: `paper-card` renders on `2025-07-02-AgileAutonomy.html` and `2024-01-15-GeometricControlSE3.html`, absent on non-paper posts.
- Per-tag RSS files exist at `public/tags/{paper,control-planning,RL,self-study}/index.xml`.
