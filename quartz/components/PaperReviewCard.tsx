import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import { isAbsoluteURL } from "../util/path"
import style from "./styles/paperReviewCard.scss"

interface PaperMeta {
  title?: string
  authors?: string | string[]
  venue?: string
  year?: string | number
  arxiv?: string
  doi?: string
  code?: string
  pdf?: string
  project?: string
  tldr?: string
  bibkey?: string
}

const arxivUrl = (id: string) =>
  isAbsoluteURL(id) ? id : `https://arxiv.org/abs/${id}`
const doiUrl = (id: string) =>
  isAbsoluteURL(id) ? id : `https://doi.org/${id}`

const normalizeAuthors = (a: unknown): string | undefined => {
  if (typeof a === "string") return a
  if (Array.isArray(a) && a.every((x) => typeof x === "string")) return a.join(", ")
  return undefined
}

const PaperReviewCard: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const paper = fileData.frontmatter?.paper as PaperMeta | undefined
  if (!paper || typeof paper !== "object") return null

  const authors = normalizeAuthors(paper.authors)

  const links: { href: string; label: string }[] = []
  if (paper.arxiv) links.push({ href: arxivUrl(paper.arxiv), label: "arXiv" })
  if (paper.doi) links.push({ href: doiUrl(paper.doi), label: "DOI" })
  if (paper.pdf && isAbsoluteURL(paper.pdf)) links.push({ href: paper.pdf, label: "PDF" })
  if (paper.code && isAbsoluteURL(paper.code)) links.push({ href: paper.code, label: "Code" })
  if (paper.project && isAbsoluteURL(paper.project))
    links.push({ href: paper.project, label: "Project" })

  return (
    <aside class={classNames(displayClass, "paper-card")}>
      {paper.title && <div class="paper-card-title">{paper.title}</div>}
      <dl class="paper-card-meta">
        {authors && (
          <>
            <dt>Authors</dt>
            <dd>{authors}</dd>
          </>
        )}
        {paper.venue && (
          <>
            <dt>Venue</dt>
            <dd>{paper.venue}</dd>
          </>
        )}
        {paper.year && (
          <>
            <dt>Year</dt>
            <dd>{paper.year}</dd>
          </>
        )}
        {paper.tldr && (
          <>
            <dt>TL;DR</dt>
            <dd>{paper.tldr}</dd>
          </>
        )}
      </dl>
      {links.length > 0 && (
        <div class="paper-card-links">
          {links.map((l) => (
            <a href={l.href} class="paper-card-link" target="_blank" rel="noopener">
              {l.label}
            </a>
          ))}
        </div>
      )}
    </aside>
  )
}

PaperReviewCard.css = style

export default (() => PaperReviewCard) satisfies QuartzComponentConstructor
