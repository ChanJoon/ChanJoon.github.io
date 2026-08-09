import { Root, RootContent } from "mdast"
import { visit } from "unist-util-visit"
import { QuartzTransformerPlugin } from "../types"

/**
 * Many notes migrated from Jekyll open with an `# Title` line that repeats the
 * frontmatter `title`. Quartz already renders the title via `ArticleTitle`, so
 * the page shows it twice and the leading H1 also eats the top level of the
 * table of contents (see `toc.ts`, which normalizes depth against the shallowest
 * heading in the document).
 *
 * This strips that leading H1 at build time only — the markdown source keeps it,
 * which matters when the notes are edited in Obsidian, where the filename
 * (`2025-12-01-SOLID`) is a poor stand-in for the title.
 *
 * The rule is structural rather than string-based: remove the first block only
 * when it is an H1 *and* the document has no other H1. A document with several
 * H1s is using them as section headings, so removing one would break it.
 *
 * Must be registered before `TableOfContents()` so the removed heading is also
 * absent from the ToC.
 */
export const StripTitleH1: QuartzTransformerPlugin = () => {
  return {
    name: "StripTitleH1",
    markdownPlugins() {
      return [
        () => {
          return (tree: Root) => {
            // remark-frontmatter leaves the frontmatter behind as a yaml node
            const isFrontmatter = (node: RootContent) => node.type === "yaml"

            const firstIdx = tree.children.findIndex((node) => !isFrontmatter(node))
            if (firstIdx === -1) return

            const first = tree.children[firstIdx]
            if (first.type !== "heading" || first.depth !== 1) return

            // count H1s anywhere in the tree, not just at the top level
            let h1Count = 0
            visit(tree, "heading", (node) => {
              if (node.depth === 1) h1Count++
            })
            if (h1Count !== 1) return

            tree.children.splice(firstIdx, 1)
          }
        },
      ]
    },
  }
}
