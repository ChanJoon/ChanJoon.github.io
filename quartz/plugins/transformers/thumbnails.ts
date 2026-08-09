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
