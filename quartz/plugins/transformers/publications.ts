import fs from "fs"
import path from "path"
import yaml from "js-yaml"
import { Root, Code } from "mdast"
import { visit } from "unist-util-visit"
import { QuartzTransformerPlugin } from "../types"

export interface Options {
  /** YAML source, relative to the repository root. */
  dataFile: string
  /** Fence language that gets replaced, e.g. ```publications */
  lang: string
}

const defaultOptions: Options = {
  dataFile: "content/publications.yaml",
  lang: "publications",
}

interface Entry {
  title: string
  authors?: string[]
  venue?: string
  year?: number | string
  note?: string
  image?: string
  links?: Record<string, string>
  selected?: boolean
}

interface Data {
  me?: string
  entries?: Entry[]
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// A trailing `*` marks equal contribution; the author matching `me` is bolded.
function renderAuthors(authors: string[], me?: string): string {
  return authors
    .map((raw) => {
      const marks = raw.match(/\*+$/)?.[0] ?? ""
      const name = raw.slice(0, raw.length - marks.length).trim()
      const marked = marks ? `${escapeHtml(name)}<sup>${marks}</sup>` : escapeHtml(name)
      return me && name === me ? `<strong>${marked}</strong>` : marked
    })
    .join(", ")
}

function renderEntry(e: Entry, me?: string): string {
  const parts: string[] = []
  parts.push(`<p class="pub-item__title">${escapeHtml(e.title)}</p>`)
  if (e.authors?.length) {
    parts.push(`<p class="pub-item__authors">${renderAuthors(e.authors, me)}</p>`)
  }
  const venue = [e.venue, e.year].filter((v) => v !== undefined && v !== null).join(", ")
  if (venue) parts.push(`<p class="pub-item__venue">${escapeHtml(venue)}</p>`)
  if (e.note) {
    // a leading * in the note is the footnote marker, not emphasis
    const note = escapeHtml(e.note).replace(/^\*/, "<sup>*</sup>")
    parts.push(`<p class="pub-item__note">${note}</p>`)
  }
  const links = Object.entries(e.links ?? {})
  if (links.length) {
    const anchors = links
      .map(([label, url]) => `<a href="${escapeHtml(url)}">${escapeHtml(label)}</a>`)
      .join("")
    parts.push(`<p class="pub-item__links">${anchors}</p>`)
  }

  const body = `<div class="pub-item__body">${parts.join("")}</div>`
  if (!e.image) {
    return `<div class="pub-item">${body}</div>`
  }
  const img =
    `<img class="pub-item__thumb" src="${escapeHtml(e.image)}" ` +
    `alt="${escapeHtml(e.title)}" loading="lazy" />`
  return `<div class="pub-item pub-item--has-thumb">${img}${body}</div>`
}

export const Publications: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  let data: Data = {}
  const filePath = path.resolve(opts.dataFile)
  try {
    data = (yaml.load(fs.readFileSync(filePath, "utf8")) as Data) ?? {}
  } catch (err) {
    // Fail the build. Warning and carrying on drops the publication list off
    // the page while the build still exits 0, which is how a broken YAML ships
    // an empty Publications section to production unnoticed.
    throw new Error(`[Publications] could not read ${opts.dataFile}: ${err}`)
  }

  return {
    name: "Publications",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root) => {
            visit(tree, "code", (node: Code, index, parent) => {
              if (node.lang !== opts.lang || !parent || index === undefined) return
              const entries = data.entries ?? []
              const wanted =
                node.value.trim() === "selected" ? entries.filter((e) => e.selected) : entries
              if (wanted.length === 0) return

              const html = `<div class="pub-list">${wanted
                .map((e) => renderEntry(e, data.me))
                .join("")}</div>`
              parent.children[index] = { type: "html", value: html }
            })
          }
        },
      ]
    },
  }
}
