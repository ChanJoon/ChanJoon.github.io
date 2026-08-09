# Changelog

## 2026-08-09

### Fixed — unpublished draft was live

- [x] `content/posts/Paper Draft.md` → `content/private/paper-draft.md`, plus `draft: true`. It was serving at `/posts/Paper-Draft`, sitting at the top of `/posts` as "2026-03-23", and shipping in `index.xml` — a paper-writing template containing unpublished PIDLoc analysis. `ignorePatterns: ["private"]` keeps the whole subtree out of the pipeline (verified against the real content dir with globby); the `draft: true` is a second latch. **Search Console index removal is still outstanding and must be done by hand.**

### Added — build-time title H1 strip

- [x] `quartz/plugins/transformers/stripTitleH1.ts` — removes the leading `# Title` when it is the document's only H1. 43 posts migrated from Jekyll opened with an H1 that repeated the frontmatter `title`, so every page rendered its title twice. Registered before `TableOfContents()` in `quartz.config.ts`.
- [x] Kept the H1 in the markdown source deliberately: filenames here are dates (`2025-12-01-SOLID`), so the H1 is what identifies a note in Obsidian. The rule is structural, not string-matching — a document with several H1s is using them as section headings and is left untouched.
- [x] Side effect, and the reason this was worth doing: `toc.ts` normalizes depth against the shallowest heading, so the duplicate H1 was pushing every real section down a level. Sections now sit at the top of the ToC and one more level fits inside `maxDepth: 4`.
- [x] Headings demoted one level in the 5 posts whose H1s were section headings (`CS285_Week3`, `quasiNewton`, `AerialRobotics_Lec3`, `illConditioned`, `BangBangControl`). Max depth after demotion is H4.
- [x] `2023-10-02-RLMath.md` — the wikilink to `2023-10-15-IntroToRL` lived only inside the stripped H1 and was the sole edge between the two notes; repeated it in the body so the backlink survives.

### Fixed — reading typography

- [x] `custom.scss` set `font-size`/`line-height` on `article > p, > ul, > ol, > blockquote`. The child combinator meant text inside list items, callouts, and blockquotes fell back to the 16px browser default, so the page changed size as you scrolled. Moved onto `article`.
- [x] `base.scss` declares `tbody, li, p { line-height: 1.6rem }` — a fixed rem that ignores font-size, and a direct element selector beats an inherited value. Overridden with `article p, article li { line-height: inherit }`.
- [x] One measure for the whole article. `max-width: 46rem` previously applied to p/ul/ol only, so headings, code blocks, tables, and images ran to the full ~850px column and the right edge never lined up.

### Changed — taxonomy

- [x] Dropped the dead `categories:` key from 57 posts and from `content/templates/template.md`. Nothing in Quartz reads it — tags are the only taxonomy — so it was a second, invisible axis that split the vocabulary.
- [x] `ros` → `ROS` across 8 frontmatter entries and 5 inline body tags. `sluggify()` does not fold case, so the build was emitting both `tags/ros.html` and `tags/ROS.html`.
- [x] `tags/pragma` was a real page: `\#pragma once` in a blockquote in `2024-03-05-PX4toMAVROSglobal.md` parsed as an inline tag (the backslash does not stop Quartz's tag parser). Wrapped in a code span.
- [x] Split the overloaded `linux` tag: `linux` keeps OS operation (filesystem, boot media, power, shell), new `setup` takes dev-environment work (editors, runtimes, containers, toolchains). Added `troubleshooting` as a cross-cutting axis over error notes that were scattered across `ROS`/`linux`/`px4`, and `research` for research-practice notes.
- [x] Tagged the 11 posts that had none. Every published post now carries at least one tag; 16 tags total.

### Known / deliberately left alone

- `2025-02-26-CS285_Week10.md` has frontmatter and no body — a title-only page is live.
- `2023-07-25-acado.md` is two unrelated snippets (ACADO OnlineData, a symlink tip) in one note, which is why it carries both `acado` and `linux`.
- `2023-07-11-InstallObsidianonUbuntu2004.md` contains an MPCC paper-review section under an inline `#paper`, so an install note appears in the paper listing.
- `layout: post` remains in 78 files. Quartz ignores it.

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
