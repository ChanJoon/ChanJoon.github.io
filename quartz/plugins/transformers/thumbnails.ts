import path from "path"
import { Root } from "mdast"
import { visit } from "unist-util-visit"
import { QuartzTransformerPlugin } from "../types"

const IMAGE_EXTENSIONS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".svg"])

/**
 * Records the first image in a note so listing pages can show a thumbnail.
 *
 * Runs after ObsidianFlavoredMarkdown, which turns `![[figure.png]]` embeds into
 * mdast image nodes, and before CrawlLinks rewrites URLs — so `node.url` here is
 * still relative to the content root (`posts/images/figure.png`), which is what
 * the thumbnail emitter needs to find the file on disk.
 *
 * Non-image embeds are skipped deliberately: one note leads with a 4.2MB PDF,
 * and remote URLs cannot be resized at build time.
 */
export const ThumbnailSource: QuartzTransformerPlugin = () => {
  return {
    name: "ThumbnailSource",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root, file) => {
            // An explicit `thumbnail:` in the frontmatter always wins. The first
            // image is only a default, and it is often wrong: on paper reviews it
            // tends to be a cropped equation or algorithm box rather than the
            // overview figure. Filename and geometry both turned out to be too
            // weak to pick the right one automatically — good and bad candidates
            // overlap on aspect ratio, area, and naming alike.
            const declared = file.data.frontmatter?.thumbnail
            if (typeof declared === "string" && declared.trim() !== "") {
              file.data.thumbnail = declared.trim()
              return
            }
            if (declared === false) return

            let found: string | undefined
            visit(tree, "image", (node) => {
              if (found !== undefined) return
              const url = node.url.split("#")[0].split("?")[0]
              if (!url || /^[a-z]+:\/\//i.test(url) || url.startsWith("data:")) return
              if (!IMAGE_EXTENSIONS.has(path.extname(url).toLowerCase())) return
              found = url
            })
            if (found !== undefined) {
              file.data.thumbnail = found
            }
          }
        },
      ]
    },
  }
}

declare module "vfile" {
  interface DataMap {
    /** Path of the note's first image, relative to the content root. */
    thumbnail: string
  }
}
