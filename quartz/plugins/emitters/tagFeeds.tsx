import { Root } from "hast"
import { GlobalConfiguration } from "../../cfg"
import { getDate } from "../../components/Date"
import { escapeHTML } from "../../util/escape"
import {
  FilePath,
  FullSlug,
  SimpleSlug,
  joinSegments,
  simplifySlug,
  slugTag,
} from "../../util/path"
import { QuartzEmitterPlugin } from "../types"
import { toHtml } from "hast-util-to-html"
import { write } from "./helpers"

export interface TagFeedItem {
  slug: FullSlug
  filePath: FilePath
  title: string
  date?: Date
  description: string
  richContent?: string
}

interface Options {
  /** Tag names to emit feeds for. Each becomes /tags/<tag>/index.xml */
  tags: string[]
  rssLimit: number
  rssFullHtml: boolean
}

const defaultOptions: Options = {
  tags: [],
  rssLimit: 20,
  rssFullHtml: false,
}

function generateRSSFeed(
  cfg: GlobalConfiguration,
  items: TagFeedItem[],
  tag: string,
  limit?: number,
): string {
  const base = cfg.baseUrl ?? ""

  const createURLEntry = (slug: SimpleSlug, item: TagFeedItem): string => {
    const pubDate = item.date ? `<pubDate>${item.date.toUTCString()}</pubDate>` : ""
    return `<item>
    <title>${escapeHTML(item.title ?? "")}</title>
    <link>https://${joinSegments(base, encodeURI(slug))}</link>
    <guid>https://${joinSegments(base, encodeURI(slug))}</guid>
    <description><![CDATA[ ${item.richContent ?? item.description} ]]></description>
    ${pubDate}
  </item>`
  }

  const sorted = [...items].sort((a, b) => {
    if (a.date && b.date) return b.date.getTime() - a.date.getTime()
    if (a.date && !b.date) return -1
    if (!a.date && b.date) return 1
    return (a.title ?? "").localeCompare(b.title ?? "")
  })

  const rendered = sorted
    .slice(0, limit ?? sorted.length)
    .map((item) => createURLEntry(simplifySlug(item.slug), item))
    .join("")

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
    <channel>
      <title>${escapeHTML(cfg.pageTitle)} — #${escapeHTML(tag)}</title>
      <link>https://${joinSegments(base, "tags", encodeURI(tag))}</link>
      <description>Posts tagged "${escapeHTML(tag)}" on ${escapeHTML(cfg.pageTitle)}</description>
      <generator>Quartz -- quartz.jzhao.xyz</generator>
      ${rendered}
    </channel>
  </rss>`
}

export const TagFeeds: QuartzEmitterPlugin<Partial<Options>> = (userOpts) => {
  const opts: Options = { ...defaultOptions, ...userOpts }
  // Normalize configured tags through slugTag so they match the tag values
  // FrontMatter writes into fileData.frontmatter.tags.
  const normalizedTags = opts.tags.map((t) => slugTag(t))
  return {
    name: "TagFeeds",
    async *emit(ctx, content) {
      const cfg = ctx.cfg.configuration

      const buckets = new Map<string, TagFeedItem[]>()
      for (const tag of normalizedTags) buckets.set(tag, [])

      for (const [tree, file] of content) {
        const fileTags = (file.data.frontmatter?.tags ?? []) as string[]
        if (!fileTags.length) continue
        const item: TagFeedItem = {
          slug: file.data.slug!,
          filePath: file.data.relativePath!,
          title: file.data.frontmatter?.title ?? "",
          date: getDate(cfg, file.data) ?? undefined,
          description: file.data.description ?? "",
          richContent: opts.rssFullHtml
            ? escapeHTML(toHtml(tree as Root, { allowDangerousHtml: true }))
            : undefined,
        }
        for (const tag of fileTags) {
          if (buckets.has(tag)) buckets.get(tag)!.push(item)
        }
      }

      for (const tag of normalizedTags) {
        const items = buckets.get(tag) ?? []
        yield write({
          ctx,
          content: generateRSSFeed(cfg, items, tag, opts.rssLimit),
          slug: joinSegments("tags", tag, "index") as FullSlug,
          ext: ".xml",
        })
      }
    },
    externalResources: (ctx) => {
      const cfg = ctx.cfg.configuration
      return {
        additionalHead: normalizedTags.map((tag) => (
          <link
            rel="alternate"
            type="application/rss+xml"
            title={`RSS Feed — #${tag}`}
            href={`https://${joinSegments(cfg.baseUrl ?? "", "tags", tag, "index.xml")}`}
          />
        )),
      }
    },
  }
}
